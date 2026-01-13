#!/usr/bin/env python3
"""
HOW TO RUN
==========
python analyse_banque.py --input fichier.csv --solde 123.45 --horizon 30 --decouvert -200

Le script génère dans le dossier courant :
- operations_enrichies.csv
- recurrents_detectes.csv
- previsionnel_<horizon>j.csv
"""

import argparse
import datetime as dt
import os
import re
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

REQUIRED_COLUMNS = [
    'Date de comptabilisation',
    'Libelle simplifie',
    'Libelle operation',
    'Reference',
    'Informations complementaires',
    'Type operation',
    'Categorie',
    'Sous categorie',
    'Debit',
    'Credit',
    'Date operation',
    'Date de valeur',
    'Pointage operation',
]

NOISE_TOKENS = {
    'cb', 'carte', 'paiement', 'fact', 'facture', 'sepa', 'prlv', 'prelevement',
    'virement', 'vir', 'ret', 'dab', 'retrait', 'transfert', 'operation',
    'paylib', 'contact', 'sans', 'ref', 'reference', 'prlvt', 'paiem', 'achat',
    'paypal', 'tp', 'tpe', 'fr', 'f', 'the', 'de', 'la', 'le', 'les', 'du', 'des',
}

PERIODICITY_RULES = {
    'hebdo': (7, 2),
    'bimensuel': (14, 3),
    'mensuel': (30, 5),
    'trimestriel': (90, 10),
}


def read_csv_with_fallback(path: str) -> pd.DataFrame:
    attempts = [
        {'sep': ';', 'encoding': 'latin1', 'decimal': ','},
        {'sep': ';', 'encoding': 'latin1', 'decimal': '.'},
        {'sep': ';', 'encoding': 'cp1252', 'decimal': ','},
        {'sep': ';', 'encoding': 'utf-8', 'decimal': ','},
        {'sep': ';', 'encoding': 'utf-8', 'decimal': '.'},
    ]

    last_error = None
    for attempt in attempts:
        try:
            return pd.read_csv(path, **attempt)
        except Exception as exc:  # pragma: no cover - fallback logic
            last_error = exc
            continue

    raise RuntimeError(f"Impossible de lire le CSV: {last_error}")


def normalize_amount(series: pd.Series) -> pd.Series:
    cleaned = (
        series.fillna('0')
        .astype(str)
        .str.replace('\u00a0', '', regex=False)
        .str.replace(' ', '', regex=False)
        .str.replace(',', '.', regex=False)
    )
    cleaned = cleaned.str.replace(r'[^0-9\.-]', '', regex=True)
    return pd.to_numeric(cleaned, errors='coerce').fillna(0.0)


def normalize_label(value: str) -> str:
    text = value.lower()
    text = re.sub(r'\b\d{2,}\b', ' ', text)
    text = re.sub(r'\b[a-z0-9]{6,}\b', ' ', text)
    text = re.sub(r'[^a-zà-ÿ\s]', ' ', text)
    tokens = [token for token in text.split() if token not in NOISE_TOKENS]
    text = ' '.join(tokens)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def build_merchant_key(value: str) -> str:
    cleaned = re.sub(r'\b\d{5}\b', ' ', value)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned[:40].strip()


def compute_periodicity(deltas: np.ndarray) -> Tuple[str, float]:
    if len(deltas) == 0:
        return 'inconnu', 0.0

    best_period = 'inconnu'
    best_ratio = 0.0
    for label, (center, tolerance) in PERIODICITY_RULES.items():
        matches = np.abs(deltas - center) <= tolerance
        ratio = matches.mean()
        if ratio > best_ratio:
            best_ratio = ratio
            best_period = label

    if best_ratio < 0.6:
        return 'inconnu', best_ratio

    return best_period, best_ratio


def compute_confidence(ratio: float, stable_score: float, occurrences: int) -> int:
    occurrence_score = min(1.0, occurrences / 6.0)
    score = 0.5 * ratio + 0.3 * stable_score + 0.2 * occurrence_score
    return int(round(score * 100))


def detect_recurrents(df: pd.DataFrame, sign: str) -> pd.DataFrame:
    if sign == 'negative':
        filtered = df[df['Montant'] < 0].copy()
    else:
        filtered = df[df['Montant'] > 0].copy()

    results = []
    for merchant_key, group in filtered.groupby('Merchant_key'):
        group = group.sort_values('Date')
        occurrences = len(group)
        if occurrences < 3:
            continue

        amounts = group['Montant']
        median_amount = amounts.median()
        std_amount = amounts.std(ddof=0)
        abs_median = abs(median_amount)
        stability_threshold = max(0.05 * abs_median, 2.0)
        stable = std_amount <= stability_threshold
        stable_score = max(0.0, 1.0 - (std_amount / stability_threshold))

        dates = group['Date'].dropna().sort_values()
        deltas = dates.diff().dt.days.dropna().to_numpy()
        periodicity, ratio = compute_periodicity(deltas)

        if not stable or ratio < 0.6:
            continue

        last_date = dates.iloc[-1].date()
        next_date = None
        if periodicity != 'inconnu':
            period_days, _ = PERIODICITY_RULES.get(periodicity, (0, 0))
            next_date = (dates.iloc[-1] + pd.Timedelta(days=period_days)).date()

        example_label = group['Libelle simplifie'].mode().iloc[0] if not group['Libelle simplifie'].mode().empty else group['Libelle simplifie'].iloc[0]
        confidence = compute_confidence(ratio, stable_score, occurrences)

        results.append({
            'Merchant_key': merchant_key,
            'Exemple_libelle': example_label,
            'Periodicite': periodicity,
            'Montant_median': round(median_amount, 2),
            'Derniere_date': last_date,
            'Prochaine_date_estimee': next_date,
            'Confiance': confidence,
            'Categorie': group['Categorie'].mode().iloc[0] if not group['Categorie'].mode().empty else group['Categorie'].iloc[0],
            'Sous_categorie': group['Sous categorie'].mode().iloc[0] if not group['Sous categorie'].mode().empty else group['Sous categorie'].iloc[0],
            'Nb_occurrences': occurrences,
        })

    return pd.DataFrame(results)


def estimate_variable_spend(df: pd.DataFrame, recurrent_keys: List[str]) -> Dict[int, float]:
    variable_df = df[(df['Montant'] < 0) & (~df['Merchant_key'].isin(recurrent_keys))].copy()
    if variable_df.empty:
        return {weekday: 0.0 for weekday in range(7)}

    end_date = df['Date'].max().normalize()
    start_date = end_date - pd.Timedelta(days=56)
    variable_df = variable_df[variable_df['Date'] >= start_date]

    calendar = pd.date_range(start=start_date, end=end_date, freq='D')
    daily_totals = variable_df.groupby(variable_df['Date'].dt.normalize())['Montant'].sum()

    totals_by_day = pd.Series(0.0, index=calendar)
    totals_by_day.loc[daily_totals.index] = daily_totals

    weekday_avgs = {}
    global_avg = totals_by_day.mean() if len(totals_by_day) else 0.0
    for weekday in range(7):
        weekday_values = totals_by_day[totals_by_day.index.weekday == weekday]
        if len(weekday_values) == 0:
            weekday_avgs[weekday] = global_avg
        else:
            weekday_avgs[weekday] = weekday_values.mean()

    return weekday_avgs


def generate_forecast(
    df: pd.DataFrame,
    recurrent_expenses: pd.DataFrame,
    recurrent_incomes: pd.DataFrame,
    solde_initial: float,
    horizon: int,
) -> pd.DataFrame:
    today = pd.Timestamp.today().normalize()
    end_date = today + pd.Timedelta(days=horizon)
    calendar = pd.date_range(start=today, end=end_date, freq='D')

    recurring_events = []

    def add_recurring_rows(recurrents: pd.DataFrame):
        for _, row in recurrents.iterrows():
            periodicite = row['Periodicite']
            period_days, _ = PERIODICITY_RULES.get(periodicite, (0, 0))
            if period_days == 0:
                continue
            last_date = pd.Timestamp(row['Derniere_date'])
            next_date = last_date + pd.Timedelta(days=period_days)
            while next_date <= end_date:
                recurring_events.append({
                    'Date': next_date.normalize(),
                    'Montant': row['Montant_median'],
                    'Label': row['Merchant_key'],
                })
                next_date += pd.Timedelta(days=period_days)

    add_recurring_rows(recurrent_expenses)
    add_recurring_rows(recurrent_incomes)

    recurring_df = pd.DataFrame(recurring_events)
    if recurring_df.empty:
        recurring_df = pd.DataFrame(columns=['Date', 'Montant', 'Label'])

    recurring_daily = recurring_df.groupby('Date')['Montant'].sum()

    recurring_detail = (
        recurring_df.groupby('Date')
        .apply(lambda g: ' | '.join([f"{row['Label']}:{row['Montant']:.2f}" for _, row in g.iterrows()]))
        .to_dict()
    )

    weekday_avgs = estimate_variable_spend(df, recurrent_expenses['Merchant_key'].tolist())

    records = []
    running_balance = solde_initial
    for day in calendar:
        recurring_amount = float(recurring_daily.get(day, 0.0))
        variable_amount = float(weekday_avgs.get(day.weekday(), 0.0))
        total = recurring_amount + variable_amount
        running_balance += total
        records.append({
            'Date': day.date(),
            'Flux_recurrents': round(recurring_amount, 2),
            'Flux_variables_estimes': round(variable_amount, 2),
            'Flux_total': round(total, 2),
            'Solde_estime': round(running_balance, 2),
            'Risque': False,
            'Detail_recurrents': recurring_detail.get(day, ''),
        })

    return pd.DataFrame(records)


def summarize_console(
    recurrents: pd.DataFrame,
    forecast: pd.DataFrame,
    decouvert: float,
) -> None:
    print("\n=== Récurrents détectés (top 10) ===")
    if recurrents.empty:
        print("Aucun récurrent détecté.")
    else:
        top = recurrents.copy()
        top['Montant_median'] = top['Montant_median'].astype(float)
        top = top.sort_values('Montant_median').head(10)
        for _, row in top.iterrows():
            print(
                f"- {row['Merchant_key']} | {row['Montant_median']:.2f} | {row['Periodicite']} | prochaine: {row['Prochaine_date_estimee']}"
            )

    print("\n=== Jours à risque (5 prochains jours avec solde minimum) ===")
    if forecast.empty:
        print("Prévisionnel indisponible.")
        return

    risk_days = forecast.sort_values('Solde_estime').head(5)
    for _, row in risk_days.iterrows():
        print(f"- {row['Date']} : solde estimé {row['Solde_estime']:.2f}")

    min_row = forecast.loc[forecast['Solde_estime'].idxmin()]
    print(f"\nSolde minimum estimé: {min_row['Solde_estime']:.2f} le {min_row['Date']}")

    if min_row['Solde_estime'] < decouvert:
        print("\n⚠️ ALERTE: Risque de passer sous le découvert autorisé.")
    else:
        print("\n✅ Aucun risque de dépasser le découvert autorisé selon l'estimation.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyse des transactions Caisse d'Épargne")
    parser.add_argument('--input', required=True, help='Chemin vers le CSV')
    parser.add_argument('--solde', required=True, type=float, help='Solde actuel')
    parser.add_argument('--horizon', type=int, default=30, help='Horizon de prévision en jours')
    parser.add_argument('--decouvert', type=float, default=-200.0, help='Seuil découvert autorisé')
    args = parser.parse_args()

    df = read_csv_with_fallback(args.input)

    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes: {missing}")

    df = df.copy()

    for col in ['Date de comptabilisation', 'Date operation', 'Date de valeur']:
        df[col] = pd.to_datetime(df[col], dayfirst=True, errors='coerce')

    df['Debit'] = normalize_amount(df['Debit'])
    df['Credit'] = normalize_amount(df['Credit'])
    df['Montant'] = df['Credit'] - df['Debit']

    df['Date'] = df['Date de comptabilisation']
    df['Date'] = df['Date'].fillna(df['Date operation']).fillna(df['Date de valeur'])
    df = df.sort_values('Date')

    df['Libelle_norm'] = df['Libelle simplifie'].fillna('').apply(normalize_label)
    df['Merchant_key'] = df['Libelle_norm'].apply(build_merchant_key)

    recurrent_expenses = detect_recurrents(df, 'negative')
    recurrent_incomes = detect_recurrents(df, 'positive')

    recurrent_expenses.to_csv('recurrents_detectes.csv', index=False)

    recurrent_map = {
        row['Merchant_key']: row
        for _, row in pd.concat([recurrent_expenses, recurrent_incomes]).iterrows()
    }

    df['Est_recurrent'] = df['Merchant_key'].isin(recurrent_map.keys())
    df['Tag_recurrent'] = df['Merchant_key'].apply(
        lambda key: recurrent_map[key]['Periodicite'] if key in recurrent_map else ''
    )
    df['Confiance_recurrent'] = df['Merchant_key'].apply(
        lambda key: recurrent_map[key]['Confiance'] if key in recurrent_map else ''
    )

    df.to_csv('operations_enrichies.csv', index=False)

    forecast = generate_forecast(
        df=df,
        recurrent_expenses=recurrent_expenses,
        recurrent_incomes=recurrent_incomes,
        solde_initial=args.solde,
        horizon=args.horizon,
    )

    forecast['Risque'] = forecast['Solde_estime'] < args.decouvert
    forecast_file = f"previsionnel_{args.horizon}j.csv"
    forecast.to_csv(forecast_file, index=False)

    summarize_console(recurrent_expenses, forecast, args.decouvert)

    print("\nFichiers générés:")
    print(f"- {os.path.abspath('operations_enrichies.csv')}")
    print(f"- {os.path.abspath('recurrents_detectes.csv')}")
    print(f"- {os.path.abspath(forecast_file)}")


if __name__ == '__main__':
    main()
