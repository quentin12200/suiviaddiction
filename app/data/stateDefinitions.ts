// Définitions et exemples pour les états émotionnels et physiques
// Adapté au contexte de sevrage (cannabis, alcool, caféine/taurine) et maladie de Leber

export interface StateInfo {
  name: string
  emoji: string
  definition: string
  examples: string[]
  isValorized?: boolean
  isPiege?: boolean
  importance?: string
}

export const emotionalStates: Record<string, StateInfo> = {
  'Calme': {
    name: 'Calme',
    emoji: '😌',
    definition: 'Sensation de paix intérieure, absence d\'agitation mentale',
    examples: [
      '🛋️ Vous êtes assis et vous n\'avez pas besoin de bouger',
      '🌊 Votre respiration est fluide, comme des vagues régulières',
      '💭 Vos pensées passent sans s\'accrocher',
      '👁️ Vous ne pensez pas à votre vue pendant un moment',
      '☕ Vous buvez votre café/thé en savourant vraiment',
      '🎵 Vous écoutez de la musique sans penser à autre chose',
      '🎓 Posé comme quand vous formez à la CGT',
      '👨‍👩‍👧 Moment paisible avec Louise ou Sophie'
    ],
    isValorized: true,
    importance: 'Chaque moment de calme prouve que vous POUVEZ vivre sans béquilles chimiques ! 🎯'
  },

  'Anxieux': {
    name: 'Anxieux',
    emoji: '😰',
    definition: 'Inquiétude diffuse, anticipation négative, nervosité',
    examples: [
      '🔄 Pensées qui tournent en boucle : "Et si la maladie se déclenche ?"',
      '👀 Vous vérifiez plusieurs fois si vous voyez bien',
      '😓 Boule au ventre sans raison précise',
      '📱 Vous cherchez des infos sur la maladie de Leber compulsivement',
      '🏃 Besoin de bouger, impossible de rester assis',
      '😵 Sensation de danger imminent sans cause précise',
      '💭 "Et si j\'échoue mon sevrage ?"'
    ],
    importance: 'C\'est normal en sevrage. Respirer profondément, noter dans l\'app 📝'
  },

  'Stressé': {
    name: 'Stressé',
    emoji: '😫',
    definition: 'Pression ressentie face à une situation précise',
    examples: [
      '💪 Mâchoire serrée, épaules remontées',
      '⚡ Envie forte de fumer pour "décompresser"',
      '🎯 Pression d\'être irréprochable : "Je DOIS y arriver"',
      '🍺 Quelqu\'un vous propose un joint ou un verre',
      '📊 Vous pensez à tout ce que vous devez gérer',
      '⏰ Impression de manquer de temps',
      '😤 Respiration rapide et courte'
    ],
    importance: 'Le stress est une RAISON de protéger votre vue, pas une excuse pour rechuter 💪'
  },

  'Joyeux': {
    name: 'Joyeux',
    emoji: '😊',
    definition: 'Sentiment de contentement, légèreté, satisfaction',
    examples: [
      '😄 Sourire spontané, vous rigolez vraiment',
      '🎉 Fierté : "J\'ai tenu bon aujourd\'hui !"',
      '🌞 Moment de légèreté où vous oubliez vos contraintes',
      '🏆 Vous réalisez : "Ça fait X jours que je protège ma vue !"',
      '🎮 Vous prenez du plaisir dans une activité simple',
      '🤝 Bon moment avec quelqu\'un que vous aimez',
      '✅ Satisfaction d\'avoir respecté votre hygiène de vie',
      '💚 Vous ressentez de la gratitude (pour votre vue actuelle, votre détermination)',
      '👨‍👩‍👧 Louise vous fait rire aux éclats',
      '❤️ Moment complice avec Sophie',
      '🛡️ Fierté après avoir aidé un camarade syndiqué',
      '🎓 Satisfaction après une formation CGT réussie'
    ],
    isValorized: true,
    importance: 'STOP et SAVOUREZ : Ces moments sont la PREUVE que la vie peut être belle sans toxiques ! Prenez 10 secondes pour vraiment ressentir cette joie 🌟'
  },

  'Triste': {
    name: 'Triste',
    emoji: '😢',
    definition: 'Mélancolie, perte d\'entrain, lourdeur émotionnelle',
    examples: [
      '💔 Vous pensez à votre frère et sa perte de vision',
      '🚬 Nostalgie de vos "moments fumeur" (même si vous savez que c\'est mieux sans)',
      '😞 Sentiment de vide ou de monotonie',
      '🥀 Les activités qui vous plaisaient semblent fades',
      '😭 Larmes faciles, sensibilité accrue',
      '⚰️ Impression de "deuil" de votre ancienne vie',
      '🌧️ Tout semble gris et sans saveur'
    ],
    importance: 'C\'est temporaire : Le sevrage crée une baisse de dopamine. Ça va revenir, promis 🌈'
  },

  'En colère': {
    name: 'En colère',
    emoji: '😡',
    definition: 'Frustration, irritation, agressivité',
    examples: [
      '🤬 Irritabilité soudaine pour des petites choses',
      '👊 Envie de crier ou de taper (contre un mur, un coussin)',
      '🦠 Rage contre cette maladie : "POURQUOI MOI ?!"',
      '😤 Frustration intense : "J\'en ai marre de tout contrôler !"',
      '🔥 Vous "explosez" sur quelqu\'un qui ne le mérite pas',
      '⚡ Impatience extrême',
      '😠 Colère contre vous-même après un écart'
    ],
    importance: 'C\'est OK d\'être en colère : Mais trouvez un exutoire sain (sport, crier dans un oreiller, écrire) 🥊'
  },

  'Ennui': {
    name: 'Ennui',
    emoji: '😑',
    definition: 'Manque de stimulation, impression de vide',
    examples: [
      '📺 Vous zappez sans rien trouver d\'intéressant',
      '⏰ Le temps semble passer TRÈS lentement',
      '🎮 Même vos activités préférées semblent "plates"',
      '🧠 Votre cerveau cherche désespérément de l\'adrénaline',
      '🥱 Sensation de vide : "Il manque quelque chose"',
      '🔄 Vous tournez en rond sans savoir quoi faire',
      '💊 Triple manque : Plus de joints + Red Bull + alcool = GROS ENNUI'
    ],
    isPiege: true,
    importance: 'DANGER : L\'ennui est le moment où vous êtes le plus vulnérable ! Ayez une liste d\'activités d\'urgence 🚨'
  },

  'Fatigué': {
    name: 'Fatigué',
    emoji: '😴',
    definition: 'Épuisement mental, lassitude',
    examples: [
      '🧠 Difficulté à décider même pour des choses simples',
      '💤 Sensation d\'être "vidé" mentalement',
      '🛑 Envie de tout arrêter, besoin de pause',
      '😵‍💫 Difficulté à suivre une conversation',
      '🎯 Fatigue de la vigilance constante sur votre santé',
      '🏋️ Charge mentale épuisante : sevrage + santé + vie'
    ],
    importance: 'C\'est normal : Votre cerveau se répare, il a besoin de repos 😴'
  },

  'Énergique': {
    name: 'Énergique',
    emoji: '⚡',
    definition: 'Dynamisme mental, envie d\'agir',
    examples: [
      '💡 Idées qui fusent, créativité',
      '🚀 Envie de faire plein de projets',
      '🎯 Motivation à fond : "Je vais y arriver !"',
      '💪 Détermination renouvelée',
      '🏃 Élan d\'action vers vos objectifs',
      '🌟 Vous vous sentez capable de tout',
      '🚩 Élan militant comme avant une action syndicale',
      '🎓 Envie de transmettre comme en formation CGT',
      '👨‍👩‍👧 Énergie pour jouer avec Louise'
    ],
    isValorized: true,
    importance: 'C\'EST VOTRE VRAIE ÉNERGIE : Sans produits ! Profitez-en à fond ! 🔋'
  },

  'Peur': {
    name: 'Peur',
    emoji: '😨',
    definition: 'Crainte intense face à un danger réel ou anticipé',
    examples: [
      '👁️ Peur viscérale de devenir malvoyant comme votre frère',
      '😱 Panique quand vous avez une envie forte de fumer',
      '👀 Terreur quand vous pensez voir moins bien (même si c\'est juste votre anxiété)',
      '🌑 Peur de perdre votre autonomie',
      '💔 Angoisse de décevoir votre famille',
      '⚠️ Sensation de danger imminent'
    ],
    importance: 'La peur peut être utile : Elle vous rappelle POURQUOI vous faites tout ça. Mais ne la laissez pas vous paralyser 🛡️'
  },

  'Culpabilité': {
    name: 'Culpabilité',
    emoji: '😔',
    definition: 'Remords, auto-reproche, honte',
    examples: [
      '😓 Regret intense après avoir fumé',
      '💔 "J\'ai gâché tous mes efforts"',
      '😞 Honte de ne pas être "parfait"',
      '🔄 Rumination : "J\'aurais dû..."',
      '👎 Auto-jugement sévère',
      '😣 Culpabilité d\'avoir fumé pendant des années'
    ],
    importance: 'STOP : L\'auto-flagellation ne sert à RIEN. Chaque instant est une nouvelle chance 🌅'
  },

  'Déterminé': {
    name: 'Déterminé',
    emoji: '💪',
    definition: 'Résolution ferme, volonté d\'acier',
    examples: [
      '🎯 Décision claire : "JE protège ma vue, point final"',
      '🛡️ Force mentale face à une tentation : "Non, je ne céderai pas"',
      '🔥 Volonté absolue, rien ne peut vous arrêter',
      '⚔️ Vous êtes en mode "guerrier"',
      '🏔️ Prêt à affronter n\'importe quel obstacle',
      '💎 Engagement envers vous-même et votre santé',
      '🦁 Vous vous sentez fort et capable',
      '🚩 Comme les 213 jours de grève que vous avez tenus',
      '✂️ Comme quand vous avez coupé avec votre père toxique',
      '🛡️ Comme quand vous défendez un salarié face à la direction',
      '📊 Même détermination que pour arriver au bureau de l\'UD',
      '🍺 Comme quand vous avez arrêté l\'alcool'
    ],
    isValorized: true,
    importance: 'CÉLÉBREZ CETTE FORCE : C\'est votre arme la plus puissante ! Vous l\'avez prouvé tant de fois ! 🏆'
  }
}

export const physicalStates: Record<string, StateInfo> = {
  'Bien': {
    name: 'Bien',
    emoji: '✅',
    definition: 'Confort physique général, absence de gêne',
    examples: [
      '🌟 Corps détendu, tout va bien',
      '🫁 Respiration libre et profonde',
      '💚 Sensation d\'équilibre et d\'harmonie',
      '🎯 Énergie stable, ni trop ni pas assez',
      '😊 Fierté physique : "Mon corps me remercie"',
      '🏃 Vous pouvez bouger librement'
    ],
    isValorized: true,
    importance: 'ARRÊTEZ-VOUS 10 SECONDES : Remarquez et savourez ce bien-être ! C\'est le résultat de vos efforts ! 🌈'
  },

  'Fatigué': {
    name: 'Fatigué',
    emoji: '😪',
    definition: 'Manque d\'énergie corporelle, lourdeur',
    examples: [
      '🛌 Corps lourd, envie de s\'allonger',
      '🥱 Bâillements répétés, paupières lourdes',
      '🏋️ Muscles qui semblent ne pas répondre',
      '⚠️ Sevrage triple = Fatigue INTENSE les premiers jours/semaines',
      '🔋 Batterie à 10%',
      '🐌 Mouvements au ralenti'
    ],
    importance: 'Votre corps se répare : C\'est temporaire. Reposez-vous sans culpabiliser 💤'
  },

  'Tendu': {
    name: 'Tendu',
    emoji: '😬',
    definition: 'Muscles contractés, rigidité corporelle',
    examples: [
      '🦷 Mâchoire serrée, dents qui grincent',
      '🏔️ Épaules remontées vers les oreilles (en "montagne")',
      '👊 Poings serrés sans vous en rendre compte',
      '🔒 Nuque raide, mal de dos',
      '😫 Tout le corps est "dur" et contracté',
      '⚡ Hyper-vigilance : Vous êtes "en alerte"'
    ],
    importance: 'Très fréquent en sevrage : Pensez à étirer, masser, respirer 🧘'
  },

  'Relaxé': {
    name: 'Relaxé',
    emoji: '😌',
    definition: 'Détente musculaire, relâchement physique',
    examples: [
      '🛋️ Muscles souples, corps "fondu" dans le siège',
      '🌊 Respiration profonde et naturelle',
      '🤲 Lourdeur agréable dans les membres',
      '😊 Visage détendu, pas de tension',
      '🧘 État post-méditation ou post-sport',
      '☁️ Sensation de flotter'
    ],
    isValorized: true,
    importance: 'RARE MAIS PRÉCIEUX : Profitez à fond de ces moments de lâcher-prise ! 🕊️'
  },

  'Douleur': {
    name: 'Douleur',
    emoji: '😣',
    definition: 'Sensation physique désagréable localisée',
    examples: [
      '🤕 Maux de tête (très fréquent en sevrage cannabis/caféine)',
      '💢 Tensions cervicales (stress chronique)',
      '🦴 Douleurs articulaires ou musculaires',
      '😖 Crampes, spasmes',
      '🤧 Mal de gorge (sevrage cannabis)',
      '🧠 Migraines liées à l\'anxiété'
    ],
    importance: 'Pensez à : Hydratation, repos, magnésium. Si ça persiste, consultez 🏥'
  },

  'Énergique': {
    name: 'Énergique',
    emoji: '🔥',
    definition: 'Vitalité corporelle, force disponible',
    examples: [
      '🏃 Envie de bouger, de marcher, de VIVRE !',
      '💪 Sensation de puissance dans les muscles',
      '⚡ Capacité à faire des efforts physiques',
      '🎉 Retour d\'énergie NATURELLE (sans Red Bull !)',
      '🌟 Vitalité qui revient par vagues',
      '🔋 Batterie à 90%'
    ],
    isValorized: true,
    importance: 'C\'EST VOTRE VRAIE FORCE : Votre corps retrouve son énergie naturelle ! Célébrez ! 🎊'
  },

  'Excité': {
    name: 'Excité',
    emoji: '😤',
    definition: 'Activation physique, montée d\'adrénaline',
    examples: [
      '💓 Cœur qui bat vite',
      '🤲 Mains qui tremblent légèrement',
      '🏃 Envie de bouger, impossible de rester immobile',
      '⚡ Agitation physique',
      '🔍 ATTENTION : Est-ce de l\'excitation positive ou le manque d\'adrénaline ?',
      '🎢 Montée d\'adrénaline (bonne ou mauvaise)'
    ],
    isPiege: true,
    importance: 'Posez-vous la question : Excitation positive (projet) ou agitation du manque ? 🤔'
  },

  'Hypervigilant': {
    name: 'Hypervigilant',
    emoji: '👀',
    definition: 'Attention excessive à vos sensations corporelles',
    examples: [
      '👁️ Vous vérifiez constamment si votre vision a changé',
      '🔍 Vous "scannez" votre corps pour détecter des symptômes',
      '😰 Hyper-attention à chaque sensation visuelle',
      '📊 Vous testez votre vue plusieurs fois par jour',
      '🔔 Tension corporelle liée à la surveillance permanente',
      '⚠️ Interprétation anxieuse de sensations normales'
    ],
    importance: 'Cercle vicieux : L\'hypervigilance crée du stress qui crée plus d\'hypervigilance 🔄'
  }
}

// États "Super-Héros" à célébrer
export const valorizedStates = [
  'Calme',
  'Joyeux',
  'Déterminé',
  'Énergique',
  'Bien',
  'Relaxé'
]

// États "Pièges" nécessitant vigilance
export const dangerousStates = [
  'Ennui',
  'Excité'
]

// Combinaisons d'états dangereuses
export const dangerousCombinations = [
  {
    states: ['Ennui', 'Excité'],
    warning: 'Manque d\'adrénaline → DANGER de rechute'
  },
  {
    states: ['Peur', 'Culpabilité'],
    warning: 'Évitement émotionnel → Tentation'
  },
  {
    states: ['Stressé', 'Tendu', 'Hypervigilant'],
    warning: 'Besoin de "décompresser"'
  }
]
