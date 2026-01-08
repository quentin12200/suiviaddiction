import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les entrées récentes
    const entries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
      take: 90, // 3 mois de données
    })

    type EntryType = typeof entries[number]

    if (entries.length < 7) {
      return NextResponse.json({
        success: false,
        message: 'Pas assez de données pour analyse de corrélations',
      })
    }

    // 1. Corrélation Heure de la journée <-> Consommation
    const timeConsumption = new Map<string, { total: number; consumed: number }>()
    entries.forEach((entry: EntryType) => {
      const hour = entry.time.split(':')[0]
      const existing = timeConsumption.get(hour) || { total: 0, consumed: 0 }
      timeConsumption.set(hour, {
        total: existing.total + 1,
        consumed: existing.consumed + (entry.hasSmoked ? 1 : 0),
      })
    })

    const timeData = Array.from(timeConsumption.entries())
      .map(([hour, data]) => ({
        hour: `${hour}h`,
        percentage: data.total > 0 ? (data.consumed / data.total) * 100 : 0,
        count: data.consumed,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))

    // 2. Corrélation Niveau d'envie <-> Consommation effective
    const cravingConsumption = new Map<number, { total: number; consumed: number }>()
    entries.forEach((entry: EntryType) => {
      const level = Math.floor(entry.cravingLevel)
      const existing = cravingConsumption.get(level) || { total: 0, consumed: 0 }
      cravingConsumption.set(level, {
        total: existing.total + 1,
        consumed: existing.consumed + (entry.hasSmoked ? 1 : 0),
      })
    })

    const cravingData = Array.from(cravingConsumption.entries())
      .map(([level, data]) => ({
        level,
        percentage: data.total > 0 ? (data.consumed / data.total) * 100 : 0,
        total: data.total,
      }))
      .sort((a, b) => a.level - b.level)

    // 3. Corrélation États émotionnels <-> Consommation
    const emotionConsumption = new Map<string, { total: number; consumed: number }>()
    entries.forEach((entry: EntryType) => {
      const emotions = entry.emotionalState.split(',').map((e: string) => e.trim()).filter((e: string) => e)
      emotions.forEach((emotion: string) => {
        const existing = emotionConsumption.get(emotion) || { total: 0, consumed: 0 }
        emotionConsumption.set(emotion, {
          total: existing.total + 1,
          consumed: existing.consumed + (entry.hasSmoked ? 1 : 0),
        })
      })
    })

    const emotionData = Array.from(emotionConsumption.entries())
      .map(([emotion, data]) => ({
        emotion,
        percentage: data.total > 0 ? (data.consumed / data.total) * 100 : 0,
        count: data.consumed,
        occurrences: data.total,
      }))
      .filter(d => d.occurrences >= 3) // Au moins 3 occurrences
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8) // Top 8

    // 4. Corrélation Contexte <-> Consommation
    const contextConsumption = new Map<string, { total: number; consumed: number }>()
    entries.forEach((entry: EntryType) => {
      if (entry.context) {
        const existing = contextConsumption.get(entry.context) || { total: 0, consumed: 0 }
        contextConsumption.set(entry.context, {
          total: existing.total + 1,
          consumed: existing.consumed + (entry.hasSmoked ? 1 : 0),
        })
      }
    })

    const contextData = Array.from(contextConsumption.entries())
      .map(([context, data]) => ({
        context,
        percentage: data.total > 0 ? (data.consumed / data.total) * 100 : 0,
        count: data.consumed,
        occurrences: data.total,
      }))
      .filter((d) => d.occurrences >= 2)
      .sort((a, b) => b.percentage - a.percentage)

    // 5. Corrélation Jour de la semaine <-> Consommation
    const weekdayConsumption = new Map<number, { total: number; consumed: number }>()
    entries.forEach((entry: EntryType) => {
      const weekday = new Date(entry.date).getDay()
      const existing = weekdayConsumption.get(weekday) || { total: 0, consumed: 0 }
      weekdayConsumption.set(weekday, {
        total: existing.total + 1,
        consumed: existing.consumed + (entry.hasSmoked ? 1 : 0),
      })
    })

    const weekdayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const weekdayData = Array.from(weekdayConsumption.entries())
      .map(([day, data]) => ({
        day: weekdayNames[day],
        percentage: data.total > 0 ? (data.consumed / data.total) * 100 : 0,
        count: data.consumed,
      }))
      .sort((a, b) => weekdayNames.indexOf(a.day) - weekdayNames.indexOf(b.day))

    // 6. Corrélation Décision consciente <-> Succès (pas de consommation)
    const consciousEntries = entries.filter((e: EntryType) => e.consciousDecision)
    const consciousSuccess = consciousEntries.filter((e: EntryType) => !e.hasSmoked).length
    const consciousRate = consciousEntries.length > 0
      ? (consciousSuccess / consciousEntries.length) * 100
      : 0

    const unconsciousEntries = entries.filter((e: EntryType) => !e.consciousDecision)
    const unconsciousSuccess = unconsciousEntries.filter((e: EntryType) => !e.hasSmoked).length
    const unconsciousRate = unconsciousEntries.length > 0
      ? (unconsciousSuccess / unconsciousEntries.length) * 100
      : 0

    // Générer insights basés sur les données
    const insights = generateInsights({
      timeData,
      cravingData,
      emotionData,
      contextData,
      weekdayData,
      consciousRate,
      unconsciousRate,
    })

    return NextResponse.json({
      success: true,
      correlations: {
        time: timeData,
        craving: cravingData,
        emotions: emotionData,
        contexts: contextData,
        weekday: weekdayData,
        consciousness: {
          conscious: consciousRate,
          unconscious: unconsciousRate,
        },
      },
      insights,
      dataPoints: entries.length,
    })
  } catch (error) {
    console.error('Erreur analyse corrélations:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function generateInsights(data: any): string[] {
  const insights: string[] = []

  // Insight sur l'heure la plus à risque
  const highestTimeRisk = data.timeData.reduce((max: any, curr: any) =>
    curr.percentage > max.percentage ? curr : max
  , { hour: '', percentage: 0 })

  if (highestTimeRisk.percentage > 60) {
    insights.push(
      `⏰ ${highestTimeRisk.hour} est ton heure la plus à risque (${highestTimeRisk.percentage.toFixed(0)}% de consommation)`
    )
  }

  // Insight sur le niveau d'envie critique
  const highCravingRisk = data.cravingData.find((d: any) => d.level >= 7 && d.percentage > 70)
  if (highCravingRisk) {
    insights.push(
      `🔥 Au-dessus de ${highCravingRisk.level}/10 d'envie, tu consommes ${highCravingRisk.percentage.toFixed(0)}% du temps`
    )
  }

  // Insight sur les émotions les plus déclenchantes
  if (data.emotionData.length > 0 && data.emotionData[0].percentage > 50) {
    insights.push(
      `😔 "${data.emotionData[0].emotion}" est l'émotion la plus corrélée à la consommation (${data.emotionData[0].percentage.toFixed(0)}%)`
    )
  }

  // Insight sur les contextes
  if (data.contextData.length > 0 && data.contextData[0].percentage > 60) {
    insights.push(
      `📍 "${data.contextData[0].context}" est le contexte le plus à risque (${data.contextData[0].percentage.toFixed(0)}%)`
    )
  }

  // Insight sur les décisions conscientes
  if (data.consciousRate < data.unconsciousRate - 20) {
    insights.push(
      `💡 Prendre des décisions conscientes réduit la consommation de ${(data.unconsciousRate - data.consciousRate).toFixed(0)}%`
    )
  }

  // Insight sur le jour de la semaine
  const highestWeekdayRisk = data.weekdayData.reduce((max: any, curr: any) =>
    curr.percentage > max.percentage ? curr : max
  , { day: '', percentage: 0 })

  if (highestWeekdayRisk.percentage > 50) {
    insights.push(
      `📅 Le ${highestWeekdayRisk.day} est ton jour le plus à risque (${highestWeekdayRisk.percentage.toFixed(0)}%)`
    )
  }

  return insights
}
