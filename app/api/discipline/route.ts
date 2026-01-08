import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const entries = await prisma.disciplineEntry.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })

    return NextResponse.json({
      success: true,
      entries,
    })
  } catch (error) {
    console.error('Erreur récupération discipline:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const {
      date,
      wakeUpTime,
      sleepTime,
      exerciseDone,
      exerciseDuration,
      productiveHours,
      distractionsResisted,
      promisesKept,
      selfRating,
      worstMoment,
      bestMoment,
      tomorrowCommitment,
      excuses,
      truthfulReflection,
    } = data

    const entry = await prisma.disciplineEntry.create({
      data: {
        date: new Date(date),
        wakeUpTime: wakeUpTime || null,
        sleepTime: sleepTime || null,
        exerciseDone: exerciseDone || false,
        exerciseDuration: exerciseDuration || 0,
        productiveHours: productiveHours || 0,
        distractionsResisted: distractionsResisted || 0,
        promisesKept: promisesKept || 0,
        selfRating: selfRating || 5,
        worstMoment: worstMoment || '',
        bestMoment: bestMoment || '',
        tomorrowCommitment: tomorrowCommitment || '',
        excuses: excuses || '',
        truthfulReflection: truthfulReflection || '',
      },
    })

    return NextResponse.json({
      success: true,
      entry,
    })
  } catch (error) {
    console.error('Erreur création discipline entry:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
