/**
 * Analyse des habitudes sur TOUT l'historique : heures habituelles, tendance, projections.
 *
 * Tout est calculé à partir des chaînes de date (YYYY-MM-DD) et d'heure (HH:mm) locales saisies,
 * sans passer par le fuseau du serveur : le même code tourne dans le navigateur et côté serveur
 * (notifications push).
 */

export type Kind = 'cigarette' | 'joint'

export interface PatternEntry {
  date: string // YYYY-MM-DD
  time: string // HH:mm (heure réelle de la conso)
  count: number
  kind: Kind
}

export interface LocalNow {
  date: string // YYYY-MM-DD
  minutes: number // minutes depuis minuit
}

const SLOT = 30 // minutes
const SLOTS = (24 * 60) / SLOT
const WINDOW = 60 // une fenêtre = 1 h glissante, testée toutes les 30 min
/** Poids divisé par deux tous les HALF_LIFE_DAYS : tout l'historique compte, le récent un peu plus. */
const HALF_LIFE_DAYS = 120
/** Une fenêtre devient « heure habituelle » si tu y fumes au moins ce pourcentage de tes journées de conso. */
export const HABIT_THRESHOLD = 0.35
/** Une habitude récente (30 derniers jours) compte aussi, même si l'historique ancien la noie. */
const RECENT_DAYS = 30
const RECENT_THRESHOLD = 0.5

const toMinutes = (time: string) => {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + (m || 0)
}
const dayNumber = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}
const dateFromDayNumber = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10)
export const formatClock = (minutes: number) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

export interface HabitWindow {
  start: number // minutes depuis minuit, début de la fenêtre d'1 h
  typical: number // heure médiane réelle des consos dans la fenêtre
  probability: number // part (pondérée) de tes journées de conso où tu fumes dans cette fenêtre
  kind: Kind // ce que tu fumes le plus à cette heure-là
  total: number // nombre de consos dans cette fenêtre sur tout l'historique
}

export interface HourBucket {
  hour: number
  allTime: number // consos sur tout l'historique
  recent: number // consos sur les 30 derniers jours
}

export interface PatternAnalysis {
  firstDate: string | null
  totalSmokes: number
  activeDays: number
  byHour: HourBucket[]
  habits: HabitWindow[]
}

export function analyzeHabits(entries: PatternEntry[], today: string): PatternAnalysis {
  const valid = entries.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && /^\d{1,2}:\d{2}/.test(e.time))
  const todayN = dayNumber(today)

  // Créneaux de 30 min touchés par jour de conso
  const days = new Map<string, Set<number>>()
  const byHour: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({ hour, allTime: 0, recent: 0 }))
  for (const e of valid) {
    const min = toMinutes(e.time)
    const slot = Math.floor(min / SLOT)
    if (!days.has(e.date)) days.set(e.date, new Set())
    days.get(e.date)!.add(slot)
    const h = Math.floor(min / 60)
    byHour[h].allTime += e.count
    if (todayN - dayNumber(e.date) < 30) byHour[h].recent += e.count
  }

  let totalWeight = 0
  let recentDays = 0
  const windowWeight = new Array(SLOTS).fill(0)
  const recentHits = new Array(SLOTS).fill(0)
  days.forEach((slots, date) => {
    const age = Math.max(0, todayN - dayNumber(date))
    const w = Math.pow(0.5, age / HALF_LIFE_DAYS)
    const recent = age < RECENT_DAYS
    totalWeight += w
    if (recent) recentDays++
    for (let s = 0; s < SLOTS; s++) {
      // fenêtre [s, s + 1 h) = créneaux s et s+1
      if (slots.has(s) || slots.has((s + 1) % SLOTS)) {
        windowWeight[s] += w
        if (recent) recentHits[s]++
      }
    }
  })
  // Score = le plus fort entre tout l'historique (pondéré) et les 30 derniers jours
  // (ramené sur le même seuil), pour ne rater ni les vieilles habitudes ni les nouvelles.
  const prob = windowWeight.map((v, s) => {
    const all = totalWeight > 0 ? v / totalWeight : 0
    const rec = recentDays >= 5 ? recentHits[s] / recentDays : 0
    return Math.max(all, rec >= RECENT_THRESHOLD ? rec : 0)
  })

  // Pics locaux au-dessus du seuil, sans chevauchement
  const candidates = prob
    .map((p, s) => ({ s, p }))
    .filter(({ s, p }) => p >= HABIT_THRESHOLD && p >= prob[(s + SLOTS - 1) % SLOTS] && p >= prob[(s + 1) % SLOTS])
    .sort((a, b) => b.p - a.p)
  const picked: number[] = []
  for (const c of candidates) {
    if (picked.every((s) => Math.min(Math.abs(s - c.s), SLOTS - Math.abs(s - c.s)) >= 2)) picked.push(c.s)
  }

  const habits = picked
    .map((s) => {
      const start = s * SLOT
      const inWindow = valid.filter((e) => {
        const d = (toMinutes(e.time) - start + 1440) % 1440
        return d < WINDOW
      })
      const offsets = inWindow.map((e) => (toMinutes(e.time) - start + 1440) % 1440).sort((a, b) => a - b)
      const median = offsets.length ? offsets[Math.floor(offsets.length / 2)] : 30
      const joints = inWindow.filter((e) => e.kind === 'joint').reduce((n, e) => n + e.count, 0)
      const cigs = inWindow.filter((e) => e.kind === 'cigarette').reduce((n, e) => n + e.count, 0)
      return {
        start,
        typical: (start + median) % 1440,
        probability: prob[s],
        kind: (joints >= cigs ? 'joint' : 'cigarette') as Kind,
        total: joints + cigs,
      }
    })
    .sort((a, b) => a.typical - b.typical)

  const firstDate = valid.length ? valid.map((e) => e.date).sort()[0] : null
  return {
    firstDate,
    totalSmokes: valid.reduce((n, e) => n + e.count, 0),
    activeDays: days.size,
    byHour,
    habits,
  }
}

/** Prochaine heure habituelle à partir de maintenant (dans les 24 h). */
export function nextHabit(habits: HabitWindow[], now: LocalNow) {
  let best: { habit: HabitWindow; inMinutes: number } | null = null
  for (const h of habits) {
    // on vise l'heure typique ; une fenêtre déjà entamée compte encore pendant 30 min
    let delta = (h.typical - now.minutes + 1440) % 1440
    if (delta > 1440 - 30) delta -= 1440
    if (!best || delta < best.inMinutes) best = { habit: h, inMinutes: delta }
  }
  return best
}

export interface MonthPoint {
  month: string // YYYY-MM
  label: string
  cigarettes: number
  joints: number
  projected: boolean // mois en cours, extrapolé à la fin du mois
  cigarettesSoFar: number
  jointsSoFar: number
}

export interface Projections {
  months: MonthPoint[]
  dailyAvg14: number
  dailyAvgPrev14: number
  trendPct: number | null // évolution des 14 derniers jours vs les 14 précédents
  projectedDailyIn4Weeks: number | null // régression linéaire sur 28 jours
  zeroDateMinusOnePerWeek: string | null // si tu enlèves 1 conso/jour chaque semaine
}

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/**
 * `dayCounts` : consos par journée (réveil → coucher), clé YYYY-MM-DD.
 * `entries` : tout l'historique, pour le cumul mensuel.
 */
export function project(entries: PatternEntry[], dayCounts: Map<string, number>, today: string): Projections {
  const todayN = dayNumber(today)

  // Cumul mensuel depuis la première conso
  const monthly = new Map<string, { cigarettes: number; joints: number }>()
  for (const e of entries) {
    const m = e.date.slice(0, 7)
    const cur = monthly.get(m) ?? { cigarettes: 0, joints: 0 }
    if (e.kind === 'joint') cur.joints += e.count
    else cur.cigarettes += e.count
    monthly.set(m, cur)
  }
  const months: MonthPoint[] = []
  const keys = Array.from(monthly.keys()).sort()
  if (keys.length) {
    let [y, m] = keys[0].split('-').map(Number)
    const [ty, tm] = today.split('-').map(Number)
    while (y < ty || (y === ty && m <= tm)) {
      const key = `${y}-${String(m).padStart(2, '0')}`
      const v = monthly.get(key) ?? { cigarettes: 0, joints: 0 }
      const isCurrent = y === ty && m === tm
      let factor = 1
      if (isCurrent) {
        const dayOfMonth = Number(today.slice(8, 10))
        const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
        factor = daysInMonth / dayOfMonth
      }
      months.push({
        month: key,
        label: `${MONTHS_FR[m - 1]} ${String(y).slice(2)}`,
        cigarettes: Math.round(v.cigarettes * factor),
        joints: Math.round(v.joints * factor),
        projected: isCurrent,
        cigarettesSoFar: v.cigarettes,
        jointsSoFar: v.joints,
      })
      m++
      if (m > 12) {
        m = 1
        y++
      }
    }
  }

  // Séries journalières sur 28 jours (journée en cours exclue : elle n'est pas finie)
  const series: number[] = []
  for (let i = 28; i >= 1; i--) series.push(dayCounts.get(dateFromDayNumber(todayN - i)) ?? 0)
  const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)
  const dailyAvgPrev14 = avg(series.slice(0, 14))
  const dailyAvg14 = avg(series.slice(14))
  const trendPct = dailyAvgPrev14 > 0 ? ((dailyAvg14 - dailyAvgPrev14) / dailyAvgPrev14) * 100 : null

  // Régression linéaire sur les jours depuis la première conso de la fenêtre (pour ne pas
  // compter une période d'abstinence comme une baisse)
  const first = series.findIndex((v) => v > 0)
  let projectedDailyIn4Weeks: number | null = null
  if (first !== -1 && series.length - first >= 7) {
    const ys = series.slice(first)
    const n = ys.length
    const mx = (n - 1) / 2
    const my = avg(ys)
    let num = 0
    let den = 0
    ys.forEach((v, x) => {
      num += (x - mx) * (v - my)
      den += (x - mx) ** 2
    })
    const slope = den ? num / den : 0
    projectedDailyIn4Weeks = Math.max(0, my + slope * (n - 1 - mx + 28))
  }

  const current = dailyAvg14
  const zeroDateMinusOnePerWeek = current > 0 ? dateFromDayNumber(todayN + Math.ceil(current) * 7) : null

  return { months, dailyAvg14, dailyAvgPrev14, trendPct, projectedDailyIn4Weeks, zeroDateMinusOnePerWeek }
}

/** Messages de prévention envoyés avant une heure habituelle. Le choix varie selon le jour. */
export function habitMessage(habit: HabitWindow, sinceLastMs: number | null, seed: string) {
  const joint = habit.kind === 'joint'
  const une = joint ? 'un joint' : 'une cigarette'
  const sa = joint ? 'son joint' : 'sa cigarette'
  const question = joint ? 'Ce joint, est-il vraiment nécessaire ?' : 'Cette cigarette, est-elle vraiment nécessaire ?'
  const at = formatClock(habit.typical)
  const pct = Math.round(habit.probability * 100)
  const held =
    sinceLastMs !== null && sinceLastMs >= 3_600_000
      ? `Ça fait ${Math.floor(sinceLastMs / 3_600_000)} h que tu tiens. `
      : ''
  const variants = [
    {
      title: `Attention, c’est ton heure habituelle (${at})`,
      body: `${held}Tu peux ne pas fumer. ${question}`,
    },
    {
      title: `Vers ${at}, ton cerveau attend ${sa}`,
      body: `${held}L’envie dure 3 à 5 minutes. Bois un verre d’eau, respire, et laisse-la passer.`,
    },
    {
      title: `${pct} % de tes journées : ${une} vers ${at}`,
      body: `${held}C’est une habitude, pas un besoin. Aujourd’hui tu peux casser le réflexe.`,
    },
    {
      title: `Heure à risque : ${at}`,
      body: `${held}Avant d’allumer, attends 10 minutes. Si l’envie est toujours là, décide à ce moment-là.`,
    },
    {
      title: `Ton heure habituelle approche (${at})`,
      body: `${held}Change d’endroit ou d’activité pendant 5 minutes : le réflexe tient au contexte.`,
    },
  ]
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return variants[h % variants.length]
}
