import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Route pour initialiser les habitudes recommandées
 * POST /api/habits/seed
 */
export async function POST() {
  try {
    console.log('🌱 Initialisation des habitudes recommandées...')

    const recommendedHabits = [
      {
        // 1. Méditation quotidienne
        name: 'Méditation quotidienne',
        trigger: 'Après mon réveil et ma toilette matinale',
        identity: 'une personne calme et centrée',
        stackAfter: 'Brosser mes dents le matin',
        visualCue: 'Coussin de méditation à côté du lit',
        reward: 'Un moment de paix mentale pour bien démarrer la journée',
        pleasure: 'Musique douce ou sons de la nature en arrière-plan',
        difficulty: 'easy',
        preparation: 'Coussin préparé, application de méditation installée',
        duration: 10,
        trackingMethod: 'timer',
        category: 'mindfulness',
        replacesAddiction: true,
        isPositive: true,
        isActive: true,
      },
      {
        // 2. Activité physique
        name: 'Activité physique (marche/vélo)',
        trigger: 'Après le déjeuner ou en fin d\'après-midi',
        identity: 'une personne active et en bonne santé',
        stackAfter: 'Manger mon déjeuner',
        visualCue: 'Chaussures de sport près de la porte',
        reward: 'Sensation de bien-être et endorphines',
        pleasure: 'Podcast ou musique énergisante pendant l\'activité',
        difficulty: 'medium',
        preparation: 'Tenue de sport prête, vélo vérifié ou chaussures sorties',
        duration: 30,
        trackingMethod: 'timer',
        category: 'physical',
        replacesAddiction: true,
        isPositive: true,
        isActive: true,
      },
      {
        // 3. Rituels de gratitude
        name: 'Journal de gratitude',
        trigger: 'Chaque soir avant de me coucher',
        identity: 'une personne reconnaissante et positive',
        stackAfter: 'Me préparer pour aller au lit',
        visualCue: 'Journal et stylo sur ma table de nuit',
        reward: 'Dormir avec des pensées positives',
        pleasure: 'Moment de réflexion calme avec une tisane',
        difficulty: 'easy',
        preparation: 'Journal dédié, stylo qui fonctionne bien',
        duration: 5,
        trackingMethod: 'checkbox',
        category: 'mindfulness',
        replacesAddiction: true,
        isPositive: true,
        isActive: true,
      },
      {
        // 4. Horaire régulier
        name: 'Respecter mon horaire quotidien',
        trigger: 'Réveil à la même heure chaque jour',
        identity: 'une personne disciplinée et structurée',
        stackAfter: null,
        visualCue: 'Planning visible sur le mur ou dans mon téléphone',
        reward: 'Sentiment de contrôle et de productivité',
        pleasure: 'Satisfaction de cocher les tâches accomplies',
        difficulty: 'medium',
        preparation: 'Planning créé la veille, alarmes configurées',
        duration: 1440, // Toute la journée
        trackingMethod: 'checkbox',
        category: 'discipline',
        replacesAddiction: false,
        isPositive: true,
        isActive: true,
      },
    ]

    // Vérifier si les habitudes existent déjà
    const existingHabits = await prisma.atomicHabit.findMany({
      where: {
        name: {
          in: recommendedHabits.map(h => h.name)
        }
      }
    })

    type HabitType = typeof existingHabits[number]

    if (existingHabits.length > 0) {
      console.log(`⚠️ ${existingHabits.length} habitude(s) existent déjà:`)
      existingHabits.forEach((h: HabitType) => console.log(`   - ${h.name}`))

      return NextResponse.json({
        success: false,
        message: `${existingHabits.length} habitude(s) existent déjà. Supprime-les d'abord ou utilise ?force=true`,
        existingHabits: existingHabits.map((h: HabitType) => h.name)
      })
    }

    // Créer toutes les habitudes
    const createdHabits = []
    for (const habitData of recommendedHabits) {
      const habit = await prisma.atomicHabit.create({
        data: habitData
      })
      createdHabits.push(habit)
      console.log(`✅ Créé: ${habit.name}`)
    }

    console.log(`🎉 ${createdHabits.length} habitudes recommandées créées avec succès!`)

    type CreatedHabitType = typeof createdHabits[number]

    return NextResponse.json({
      success: true,
      message: `${createdHabits.length} habitudes recommandées créées avec succès`,
      habits: createdHabits.map((h: CreatedHabitType) => ({
        id: h.id,
        name: h.name,
        category: h.category,
        duration: h.duration,
      }))
    })

  } catch (error) {
    console.error('❌ Erreur lors de la création des habitudes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création des habitudes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprimer toutes les habitudes recommandées
 */
export async function DELETE() {
  try {
    const habitNames = [
      'Méditation quotidienne',
      'Activité physique (marche/vélo)',
      'Journal de gratitude',
      'Respecter mon horaire quotidien'
    ]

    const deleted = await prisma.atomicHabit.deleteMany({
      where: {
        name: {
          in: habitNames
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `${deleted.count} habitude(s) supprimée(s)`,
      count: deleted.count
    })

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
