'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import styles from './page.module.css'

export default function HyperactivityPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>⚡ Gérer l'Hyperactivité</h1>
          <p className={styles.subtitle}>
            Ton énergie est un atout, pas un problème. Apprends à la canaliser.
          </p>
        </div>

        {/* Introduction */}
        <div className={styles.introCard}>
          <h2>🧠 Comprendre ton hyperactivité</h2>
          <p>
            L'hyperactivité n'est pas une maladie, c'est une caractéristique de ton fonctionnement cérébral.
            Tu as besoin de <strong>stimulation constante</strong>, et quand tu n'en as pas, ton cerveau
            la cherche ailleurs (cannabis, distractions, comportements impulsifs).
          </p>
          <div className={styles.keyPoint}>
            <strong>La clé :</strong> Donner à ton cerveau la stimulation dont il a besoin de manière productive.
          </div>
        </div>

        {/* Stratégies immédiates */}
        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => toggleSection('immediate')}
          >
            <h2>🚀 Stratégies Immédiates (quand tu sens l'agitation)</h2>
            <span className={styles.arrow}>{expandedSection === 'immediate' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'immediate' && (
            <div className={styles.sectionContent}>
              <div className={styles.strategyCard}>
                <h3>1. Mouvement physique intense (5-10 min)</h3>
                <ul>
                  <li>20 burpees</li>
                  <li>Course sur place à fond</li>
                  <li>Pompes jusqu'à épuisement</li>
                  <li>Jumping jacks</li>
                </ul>
                <div className={styles.why}>
                  <strong>Pourquoi ça marche :</strong> Décharge la dopamine et l'adrénaline immédiatement.
                </div>
              </div>

              <div className={styles.strategyCard}>
                <h3>2. Douche froide</h3>
                <ul>
                  <li>30 secondes minimum d'eau glacée</li>
                  <li>Respiration profonde pendant</li>
                  <li>Focus sur la sensation</li>
                </ul>
                <div className={styles.why}>
                  <strong>Pourquoi ça marche :</strong> Choc sensoriel qui recentre instantanément ton attention.
                </div>
              </div>

              <div className={styles.strategyCard}>
                <h3>3. Respiration 4-7-8</h3>
                <ul>
                  <li>Inspire par le nez pendant 4 secondes</li>
                  <li>Retiens pendant 7 secondes</li>
                  <li>Expire par la bouche pendant 8 secondes</li>
                  <li>Répète 4 fois</li>
                </ul>
                <div className={styles.why}>
                  <strong>Pourquoi ça marche :</strong> Active le système nerveux parasympathique (calme).
                </div>
              </div>

              <div className={styles.strategyCard}>
                <h3>4. Tâche manuelle simple</h3>
                <ul>
                  <li>Ranger ton bureau</li>
                  <li>Laver la vaisselle en pleine conscience</li>
                  <li>Plier du linge</li>
                  <li>Dessiner/colorier</li>
                </ul>
                <div className={styles.why}>
                  <strong>Pourquoi ça marche :</strong> Occupe les mains et l'esprit sans surcharge cognitive.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Structuration quotidienne */}
        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => toggleSection('daily')}
          >
            <h2>📅 Structuration Quotidienne</h2>
            <span className={styles.arrow}>{expandedSection === 'daily' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'daily' && (
            <div className={styles.sectionContent}>
              <div className={styles.scheduleCard}>
                <h3>Ton cerveau hyperactif a besoin de rythme</h3>

                <div className={styles.timeBlock}>
                  <div className={styles.time}>6h-8h</div>
                  <div className={styles.activity}>
                    <strong>MATIN - Pic d'énergie</strong>
                    <p>Utilise cette énergie pour les tâches difficiles</p>
                    <ul>
                      <li>Sport intense (30-45 min)</li>
                      <li>Douche froide</li>
                      <li>Tâche importante #1</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.timeBlock}>
                  <div className={styles.time}>8h-12h</div>
                  <div className={styles.activity}>
                    <strong>FOCUS MATINAL</strong>
                    <p>Travail en blocs de 45 min + pauses de 15 min</p>
                    <ul>
                      <li>Pas de notifications</li>
                      <li>Pas de téléphone</li>
                      <li>Timer visible</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.timeBlock}>
                  <div className={styles.time}>12h-14h</div>
                  <div className={styles.activity}>
                    <strong>PAUSE ACTIVE</strong>
                    <ul>
                      <li>Marche dehors (obligatoire)</li>
                      <li>Repas léger (pas de sucre rapide)</li>
                      <li>Pas d'écran</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.timeBlock}>
                  <div className={styles.time}>14h-18h</div>
                  <div className={styles.activity}>
                    <strong>APRÈS-MIDI - Énergie variable</strong>
                    <ul>
                      <li>Tâches moyennes en blocs de 30 min</li>
                      <li>Micro-pauses actives (pompes, squats)</li>
                      <li>Debout si possible</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.timeBlock}>
                  <div className={styles.time}>18h-20h</div>
                  <div className={styles.activity}>
                    <strong>DÉCHARGE - CRITIQUE</strong>
                    <p className={styles.danger}>⚠️ Moment à haut risque de rechute</p>
                    <ul>
                      <li>Sport/marche obligatoire</li>
                      <li>Activité sociale</li>
                      <li>Cuisine</li>
                      <li>PAS d'isolement</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.timeBlock}>
                  <div className={styles.time}>20h-22h</div>
                  <div className={styles.activity}>
                    <strong>WIND DOWN</strong>
                    <ul>
                      <li>Lumières tamisées</li>
                      <li>Lecture</li>
                      <li>Étirements</li>
                      <li>Pas d'écrans 1h avant le coucher</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activités pour canaliser l'énergie */}
        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => toggleSection('activities')}
          >
            <h2>🎯 Activités pour Canaliser l'Énergie</h2>
            <span className={styles.arrow}>{expandedSection === 'activities' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'activities' && (
            <div className={styles.sectionContent}>
              <div className={styles.categoryCard}>
                <h3>💪 Physique (décharge dopamine)</h3>
                <ul>
                  <li><strong>Course à pied</strong> - Idéal pour vider la tête</li>
                  <li><strong>Musculation</strong> - Focus intense, résultats visibles</li>
                  <li><strong>Sports de combat</strong> - Boxe, MMA (discipline + décharge)</li>
                  <li><strong>Escalade</strong> - Requiert attention totale</li>
                  <li><strong>Natation</strong> - Répétitif et méditatif</li>
                </ul>
              </div>

              <div className={styles.categoryCard}>
                <h3>🧠 Mental (stimulation cognitive)</h3>
                <ul>
                  <li><strong>Apprendre un langage de programmation</strong></li>
                  <li><strong>Échecs en ligne</strong> - Parties rapides</li>
                  <li><strong>Puzzles complexes</strong></li>
                  <li><strong>Lecture dense</strong> - Philosophie, psychologie</li>
                  <li><strong>Écriture</strong> - Blog, journal, projets</li>
                </ul>
              </div>

              <div className={styles.categoryCard}>
                <h3>🎨 Créatif (flow state)</h3>
                <ul>
                  <li><strong>Dessin/peinture</strong></li>
                  <li><strong>Musique</strong> - Apprendre un instrument</li>
                  <li><strong>Bricolage/DIY</strong></li>
                  <li><strong>Photographie</strong></li>
                  <li><strong>Cuisine élaborée</strong></li>
                </ul>
              </div>

              <div className={styles.categoryCard}>
                <h3>🤝 Social (connexion + distraction)</h3>
                <ul>
                  <li><strong>Sport d'équipe</strong></li>
                  <li><strong>Jeux de société</strong></li>
                  <li><strong>Sorties actives</strong> - Randonnée, vélo en groupe</li>
                  <li><strong>Bénévolat</strong> - Utilité immédiate</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Pièges à éviter */}
        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => toggleSection('traps')}
          >
            <h2>⚠️ Pièges à Éviter</h2>
            <span className={styles.arrow}>{expandedSection === 'traps' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'traps' && (
            <div className={styles.sectionContent}>
              <div className={styles.trapCard}>
                <h3>❌ Stimulation passive</h3>
                <p>
                  Netflix, réseaux sociaux, YouTube = fausse stimulation.
                  Ton cerveau est occupé mais pas satisfait. Résultat : encore plus d'agitation après.
                </p>
                <div className={styles.solution}>
                  <strong>Solution :</strong> Limite à 30 min/jour. Préfère la stimulation ACTIVE.
                </div>
              </div>

              <div className={styles.trapCard}>
                <h3>❌ Sucre et caféine en excès</h3>
                <p>
                  Tu cherches l'énergie mais tu crées des montagnes russes de dopamine.
                  Crash garanti 2h après.
                </p>
                <div className={styles.solution}>
                  <strong>Solution :</strong> Max 2 cafés avant 14h. Snacks protéinés plutôt que sucrés.
                </div>
              </div>

              <div className={styles.trapCard}>
                <h3>❌ Manque de sommeil</h3>
                <p>
                  Hyperactivité + fatigue = recherche de stimulants (cannabis, café, sucre).
                  Cercle vicieux.
                </p>
                <div className={styles.solution}>
                  <strong>Solution :</strong> 7-8h non négociables. Routine de coucher stricte.
                </div>
              </div>

              <div className={styles.trapCard}>
                <h3>❌ Isolement sans plan</h3>
                <p>
                  Seul + agité + sans activité = moment critique pour rechute.
                </p>
                <div className={styles.solution}>
                  <strong>Solution :</strong> Planifie TOUJOURS ton temps seul avec une activité précise.
                </div>
              </div>

              <div className={styles.trapCard}>
                <h3>❌ Multitasking</h3>
                <p>
                  Tu crois être productif mais tu épuises ton attention.
                  Résultat : frustration et besoin de "décompresser" (= rechute).
                </p>
                <div className={styles.solution}>
                  <strong>Solution :</strong> UNE tâche à la fois. Timer. Pause. Prochaine tâche.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suppléments et outils */}
        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => toggleSection('tools')}
          >
            <h2>🧪 Suppléments et Outils (optionnel)</h2>
            <span className={styles.arrow}>{expandedSection === 'tools' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'tools' && (
            <div className={styles.sectionContent}>
              <div className={styles.toolCard}>
                <h3>Magnésium</h3>
                <p>Calme le système nerveux. Idéal le soir.</p>
                <div className={styles.dosage}>300-400mg avant coucher</div>
              </div>

              <div className={styles.toolCard}>
                <h3>L-Théanine</h3>
                <p>Focus calme sans l'agitation du café. Prends avec ta caféine.</p>
                <div className={styles.dosage}>200mg avec ton café du matin</div>
              </div>

              <div className={styles.toolCard}>
                <h3>Oméga-3</h3>
                <p>Améliore fonction cognitive et régulation émotionnelle.</p>
                <div className={styles.dosage}>1-2g EPA/DHA par jour</div>
              </div>

              <div className={styles.toolCard}>
                <h3>Timer Pomodoro</h3>
                <p>Structure ton temps. 25 min focus + 5 min pause.</p>
              </div>

              <div className={styles.toolCard}>
                <h3>Bullet Journal</h3>
                <p>Externalise tes pensées. Ton cerveau peut arrêter de tout retenir.</p>
              </div>

              <div className={styles.toolCard}>
                <h3>Musique focus</h3>
                <p>Binaural beats, lo-fi, musique classique. Bloque les distractions sonores.</p>
              </div>
            </div>
          )}
        </div>

        {/* Plan d'urgence */}
        <div className={styles.emergencyCard}>
          <h2>🚨 Plan d'Urgence (forte agitation + envie de fumer)</h2>
          <ol className={styles.emergencyList}>
            <li>
              <strong>Mouvement immédiat</strong> - 20 burpees OU course sur place 2 min
            </li>
            <li>
              <strong>Respiration 4-7-8</strong> - 4 cycles complets
            </li>
            <li>
              <strong>Appelle quelqu'un</strong> - N'importe qui. Parle 5 minutes.
            </li>
            <li>
              <strong>Change d'environnement</strong> - Sors dehors. Maintenant.
            </li>
            <li>
              <strong>Tâche manuelle</strong> - Vaisselle, rangement, douche
            </li>
          </ol>
          <div className={styles.emergencyNote}>
            L'envie passe en 10-15 minutes MAX. Ton job : survivre ces 15 minutes.
          </div>
        </div>

        {/* Conclusion */}
        <div className={styles.conclusionCard}>
          <h2>💎 L'essentiel</h2>
          <div className={styles.keyPoints}>
            <div className={styles.point}>
              <strong>1. Ton hyperactivité est une force</strong>
              <p>Quand elle est canalisée, tu es plus créatif, productif et résilient que la moyenne.</p>
            </div>
            <div className={styles.point}>
              <strong>2. Structure = Liberté</strong>
              <p>Plus tu structures tes journées, moins tu as d'espace mental pour l'agitation.</p>
            </div>
            <div className={styles.point}>
              <strong>3. Mouvement quotidien NON-NÉGOCIABLE</strong>
              <p>Sport = médicament le plus puissant pour ton cerveau.</p>
            </div>
            <div className={styles.point}>
              <strong>4. Stimulation active > Stimulation passive</strong>
              <p>Crée au lieu de consommer. Agis au lieu de regarder.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
