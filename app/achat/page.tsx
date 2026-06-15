'use client'

import { useState, useEffect } from 'react'
import styles from './achat.module.css'

const questions = [
  { id: 1, question: "En aurez-vous encore besoin dans 6 mois ?", options: ["Oui, certainement", "Peut-être", "Probablement pas", "Non"] },
  { id: 2, question: "Pour qui achetez-vous vraiment ceci ?", options: ["Pour un besoin réel", "Pour me faire plaisir", "Pour paraître aux autres", "Je ne sais pas vraiment"] },
  { id: 3, question: "Avez-vous déjà quelque chose qui remplit le même rôle ?", options: ["Non, rien de similaire", "Quelque chose d'approchant", "Oui mais moins bien", "Oui, exactement pareil"] },
  { id: 4, question: "Quel problème concret cet achat résout-il ?", options: ["Un problème précis et fréquent", "Un problème occasionnel", "Un problème imaginaire", "Aucun problème réel"] },
  { id: 5, question: "Si vous attendez 48h, y penserez-vous encore ?", options: ["Certainement oui", "Probablement oui", "Peut-être", "Probablement non"] },
  { id: 6, question: "Cet achat rentre-t-il dans votre budget ?", options: ["Oui, facilement", "Oui avec un effort", "C'est serré", "Non, c'est un écart"] },
  { id: 7, question: "Est-ce une impulsion liée à votre humeur actuelle ?", options: ["Non, je suis serein", "Légèrement", "Oui, je suis stressé/ennuyé", "Oui, clairement une impulsion"] },
  { id: 8, question: "Comment vous sentirez-vous 1 semaine après l'achat ?", options: ["Satisfait et utile", "Content sur le moment", "Indifférent", "Probablement coupable"] },
]

const OPTION_SCORES = [25, 17, 8, 0]

interface ProductInfo {
  produit: string
  prix: string
  categorie: string
}

interface HistoryItem {
  id: number
  createdAt: string
  produit: string
  prix: string | null
  categorie: string | null
  score: number
  decision: string
  utilisateur: string
}

export default function AchatPage() {
  const [step, setStep] = useState(0)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [productInfo, setProductInfo] = useState<ProductInfo>({ produit: '', prix: '', categorie: '' })
  const [manualName, setManualName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])
  const [utilisateur, setUtilisateur] = useState('moi')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (showHistory) {
      fetch('/api/achat-test')
        .then(r => r.json())
        .then(data => setHistory(data))
        .catch(() => {})
    }
  }, [showHistory])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string
      setImageBase64(base64)
      setAnalyzing(true)
      try {
        const res = await fetch('/api/achat-analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        })
        const data = await res.json()
        if (!data.error) {
          setProductInfo({ produit: data.produit || '', prix: data.prix || '', categorie: data.categorie || '' })
        }
      } catch {}
      setAnalyzing(false)
    }
    reader.readAsDataURL(file)
  }

  const startTest = () => {
    const name = productInfo.produit || manualName
    if (!name.trim()) return
    setProductInfo(p => ({ ...p, produit: name }))
    setStep(1)
  }

  const handleAnswer = (qIndex: number, optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[qIndex] = optionIndex
    setAnswers(newAnswers)
    if (qIndex + 1 < questions.length) {
      setTimeout(() => setStep(qIndex + 2), 300)
    } else {
      setTimeout(() => setStep(9), 300)
    }
  }

  const computeScore = () => {
    const total = answers.reduce((sum, a) => sum + OPTION_SCORES[a], 0)
    return Math.round((total / (questions.length * 25)) * 100)
  }

  const getDecision = (score: number) => {
    if (score >= 70) return { decision: 'acheter', message: '✅ Achat réfléchi', color: '#22c55e', advice: 'Cet achat semble justifié. Vous pouvez y aller sereinement.' }
    if (score >= 40) return { decision: 'attendre', message: '⏳ Attendez 48h', color: '#f97316', advice: 'Des doutes subsistent. Mettez-le dans vos favoris et revenez dans 2 jours.' }
    return { decision: 'renoncer', message: '🚫 Impulsion détectée', color: '#ef4444', advice: 'Cet achat ressemble à une impulsion. Éloignez-vous du site maintenant.' }
  }

  const handleSave = async () => {
    setSaving(true)
    const score = computeScore()
    const { decision } = getDecision(score)
    try {
      await fetch('/api/achat-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit: productInfo.produit,
          prix: productInfo.prix,
          categorie: productInfo.categorie,
          reponses: JSON.stringify(answers),
          score,
          decision,
          utilisateur
        })
      })
      setSaved(true)
    } catch {}
    setSaving(false)
  }

  const reset = () => {
    setStep(0)
    setImageBase64(null)
    setProductInfo({ produit: '', prix: '', categorie: '' })
    setManualName('')
    setAnswers([])
    setUtilisateur('moi')
    setSaved(false)
    setAnalyzing(false)
  }

  const score = step === 9 && answers.length === 8 ? computeScore() : 0
  const result = step === 9 ? getDecision(score) : null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🛒 Frein à l&apos;Achat</h1>
        <p className={styles.subtitle}>Avant d&apos;acheter, prenons le temps de réfléchir</p>
        <div className={styles.tabBar}>
          <button className={!showHistory ? styles.tabActive : styles.tab} onClick={() => setShowHistory(false)}>Test</button>
          <button className={showHistory ? styles.tabActive : styles.tab} onClick={() => setShowHistory(true)}>Historique</button>
        </div>
      </div>

      {showHistory ? (
        <div className={styles.historyList}>
          {history.length === 0 && <p className={styles.emptyHistory}>Aucun test sauvegardé pour l&apos;instant.</p>}
          {history.map(item => {
            const d = getDecision(item.score)
            return (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.historyLeft}>
                  <span className={styles.historyProduit}>{item.produit}</span>
                  <span className={styles.historyMeta}>{new Date(item.createdAt).toLocaleDateString('fr-FR')} · {item.utilisateur === 'moi' ? 'Moi' : 'Ma femme'}</span>
                </div>
                <div className={styles.historyRight}>
                  <span className={styles.historyScore}>{item.score}/100</span>
                  <span className={styles.decisionBadge} style={{ backgroundColor: d.color }}>{d.message}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
          {step === 0 && (
            <div className={styles.stepCard}>
              <div className={styles.uploadRow}>
                <div className={styles.uploadZone}>
                  <label className={styles.uploadButton}>
                    📸 Importer une image
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                  </label>
                  {analyzing && <p className={styles.analyzingText}>L&apos;IA analyse l&apos;image...</p>}
                  {imageBase64 && !analyzing && (
                    <img src={imageBase64} alt="preview" className={styles.imagePreview} />
                  )}
                </div>
                <div className={styles.orDivider}>ou</div>
                <div className={styles.manualZone}>
                  <label className={styles.inputLabel}>Nom du produit</label>
                  <input
                    className={styles.editInput}
                    type="text"
                    placeholder="Ex: AirPods Pro..."
                    value={productInfo.produit || manualName}
                    onChange={e => {
                      setManualName(e.target.value)
                      setProductInfo(p => ({ ...p, produit: e.target.value }))
                    }}
                  />
                </div>
              </div>

              {(productInfo.prix || productInfo.categorie) && (
                <div className={styles.productCard}>
                  <div className={styles.productRow}>
                    <span className={styles.productLabel}>Prix</span>
                    <input className={styles.editInput} value={productInfo.prix} onChange={e => setProductInfo(p => ({ ...p, prix: e.target.value }))} placeholder="Non détecté" />
                  </div>
                  <div className={styles.productRow}>
                    <span className={styles.productLabel}>Catégorie</span>
                    <input className={styles.editInput} value={productInfo.categorie} onChange={e => setProductInfo(p => ({ ...p, categorie: e.target.value }))} placeholder="Non détectée" />
                  </div>
                </div>
              )}

              <button
                className={styles.btnPrimary}
                onClick={startTest}
                disabled={!productInfo.produit.trim() && !manualName.trim()}
              >
                Commencer le test →
              </button>
            </div>
          )}

          {step >= 1 && step <= 8 && (
            <div className={styles.stepCard}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${((step - 1) / questions.length) * 100}%` }} />
              </div>
              <p className={styles.progressText}>Question {step} / {questions.length}</p>
              <div className={styles.questionCard}>
                <p className={styles.questionText}>{questions[step - 1].question}</p>
                <div className={styles.optionsList}>
                  {questions[step - 1].options.map((opt, i) => (
                    <button
                      key={i}
                      className={`${styles.optionButton} ${answers[step - 1] === i ? styles.optionSelected : ''}`}
                      onClick={() => handleAnswer(step - 1, i)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {step > 1 && (
                <button className={styles.btnSecondary} onClick={() => setStep(step - 1)}>← Précédent</button>
              )}
            </div>
          )}

          {step === 9 && result && (
            <div className={styles.stepCard}>
              <div className={styles.resultCard}>
                <div className={styles.scoreCircle} style={{ borderColor: result.color }}>
                  <span className={styles.scoreNumber} style={{ color: result.color }}>{score}</span>
                  <span className={styles.scoreLabel}>/100</span>
                </div>
                <span className={styles.decisionBadge} style={{ backgroundColor: result.color }}>{result.message}</span>
                <p className={styles.produitName}>{productInfo.produit}</p>
                <p className={styles.adviceText}>{result.advice}</p>
              </div>

              <div className={styles.utilisateurSelector}>
                <p className={styles.utilisateurLabel}>Qui fait ce test ?</p>
                <div className={styles.utilisateurBtns}>
                  <button
                    className={utilisateur === 'moi' ? styles.utilisateurBtnActive : styles.utilisateurBtn}
                    onClick={() => setUtilisateur('moi')}
                  >Moi</button>
                  <button
                    className={utilisateur === 'femme' ? styles.utilisateurBtnActive : styles.utilisateurBtn}
                    onClick={() => setUtilisateur('femme')}
                  >Ma femme</button>
                </div>
              </div>

              <div className={styles.actionBtns}>
                {!saved ? (
                  <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                    {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                  </button>
                ) : (
                  <p className={styles.savedText}>✅ Sauvegardé !</p>
                )}
                <button className={styles.btnSecondary} onClick={reset}>🔄 Recommencer</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
