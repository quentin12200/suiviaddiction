const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const readings = [
  // STOÏCISME
  {
    title: "Manuel d'Épictète",
    author: "Épictète",
    category: "stoïcisme",
    description: "Plus court et plus actionnable que Marc Aurèle. Distinction cruciale : ce qui dépend de toi VS ce qui n'en dépend pas. Te recentrer sur ce que tu CONTRÔLES vraiment.",
    priority: 0,
  },
  {
    title: "Lettres à Lucilius",
    author: "Sénèque",
    category: "stoïcisme",
    description: "Conseils concrets sur la vie quotidienne. Lutte contre les passions destructrices. Sénèque parle beaucoup de maîtrise de soi et de tempérance.",
    priority: 0,
  },

  // PSYCHOLOGIE & ADDICTIONS
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "psychologie",
    description: "Comment construire de bonnes habitudes et casser les mauvaises. Système des 4 lois du changement de comportement. Exactement ce que tu vis - remplacer addictions par habitudes constructives.",
    priority: 1, // TOP
  },
  {
    title: "The Power of Habit",
    author: "Charles Duhigg",
    category: "psychologie",
    description: "La science derrière les habitudes. Boucle : déclencheur → routine → récompense. Comprendre tes patterns (isolement → vide → addictions).",
    priority: 0,
  },
  {
    title: "L'Homme en quête de sens",
    author: "Viktor Frankl",
    category: "psychologie",
    description: "Psychiatre survivant des camps nazis. Logothérapie : trouver du SENS même dans la souffrance. Tu parles de VIDE, d'absence d'objectif - ce livre EST la réponse.",
    priority: 1, // TOP
  },

  // DISCIPLINE & ACTION
  {
    title: "Can't Hurt Me",
    author: "David Goggins",
    category: "discipline",
    description: "Ex-obèse devenu Navy SEAL. Dépasser ses limites mentales. Tu cherches l'adrénaline ? Il montre comment la trouver dans le dépassement de soi, pas la transgression.",
    priority: 1, // TOP
  },
  {
    title: "Discipline Equals Freedom",
    author: "Jocko Willink",
    category: "discipline",
    description: "Ex-Navy SEAL. La discipline comme chemin vers la liberté. Court, brutal, actionnable - exactement ce dont tu as besoin.",
    priority: 0,
  },
  {
    title: "The War of Art",
    author: "Steven Pressfield",
    category: "discipline",
    description: "Combat contre la procrastination et la résistance interne. Pour les créatifs qui n'arrivent pas à passer à l'action. Transforme l'isolement en création au lieu d'addiction.",
    priority: 0,
  },

  // SENS DE LA VIE & EXISTENTIALISME
  {
    title: "Le Mythe de Sisyphe",
    author: "Albert Camus",
    category: "existentialisme",
    description: "Faut-il vivre dans un monde absurde ? La révolte comme réponse. Tu ressens le vide - Camus l'affronte de face.",
    priority: 0,
  },
  {
    title: "Ainsi parlait Zarathoustra",
    author: "Friedrich Nietzsche",
    category: "existentialisme",
    description: "Création de ses propres valeurs. Amor fati : aimer son destin. Créer ton propre sens au lieu de le chercher ailleurs.",
    priority: 0,
  },

  // MAÎTRISE MENTALE & MÉDITATION
  {
    title: "Wherever You Go, There You Are",
    author: "Jon Kabat-Zinn",
    category: "méditation",
    description: "Méditation de pleine conscience. Être présent au lieu de fuir. Arrêter de fuir dans les addictions, être présent avec le vide.",
    priority: 0,
  },
  {
    title: "The Obstacle Is the Way",
    author: "Ryan Holiday",
    category: "stoïcisme",
    description: "Stoïcisme moderne. Transformer obstacles en opportunités. Tes addictions = obstacles. Ce livre montre comment les utiliser pour grandir.",
    priority: 0,
  },
];

async function main() {
  console.log('Seeding readings...\n');

  for (const reading of readings) {
    const created = await prisma.reading.create({
      data: {
        ...reading,
        updatedAt: new Date(),
      },
    });
    console.log(`✓ Added: "${created.title}" by ${created.author}`);
  }

  console.log(`\n✅ Seeded ${readings.length} books successfully!`);
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
