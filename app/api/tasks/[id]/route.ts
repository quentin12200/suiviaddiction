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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const task = await prisma.taskItem.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        priority: body.priority,
        category: body.category,
        completed: body.completed,
        dueDate: body.dueDate !== undefined ? toDate(body.dueDate) : undefined,
        lastCompleted: body.lastCompleted !== undefined ? toDate(body.lastCompleted) : undefined,
        daysNotCompleted: body.daysNotCompleted,
      },
    })

    return NextResponse.json({ success: true, task: serializeTask(task) })
  } catch (error) {
    console.error('Erreur maj tâche:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.taskItem.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression tâche:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
