import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const toDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const serializeTask = (task: any) => ({
  ...task,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
  dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : undefined,
  lastCompleted: task.lastCompleted ? task.lastCompleted.toISOString().split('T')[0] : undefined,
})

export async function GET() {
  try {
    const tasks = await prisma.taskItem.findMany({
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ success: true, tasks: tasks.map(serializeTask) })
  } catch (error) {
    console.error('Erreur récupération tâches:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Titre manquant' }, { status: 400 })
    }

    const task = await prisma.taskItem.create({
      data: {
        title: body.title,
        description: body.description || '',
        type: body.type || 'ponctuelle',
        priority: body.priority || 'normale',
        category: body.category || 'Personnel',
        completed: Boolean(body.completed),
        createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
        dueDate: toDate(body.dueDate),
        lastCompleted: toDate(body.lastCompleted),
        daysNotCompleted: body.daysNotCompleted || 0,
        isFromHabit: Boolean(body.isFromHabit),
        habitId: body.habitId || null,
      },
    })

    return NextResponse.json({ success: true, task: serializeTask(task) })
  } catch (error) {
    console.error('Erreur création tâche:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { tasks } = body

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ success: false, error: 'Format invalide' }, { status: 400 })
    }

    // Mise à jour en batch avec Promise.all pour paralléliser
    const updatePromises = tasks.map(task =>
      prisma.taskItem.update({
        where: { id: task.id },
        data: {
          completed: task.completed,
          lastCompleted: toDate(task.lastCompleted),
          daysNotCompleted: task.daysNotCompleted,
        },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur mise à jour batch tâches:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
