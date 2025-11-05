
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const notificationPreferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  emailNotificationsInteractions: z.boolean().optional(),
  emailNotificationsNews: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotificationsEnabled: true,
        emailNotificationsInteractions: true,
        emailNotificationsNews: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      emailNotificationsInteractions: user.emailNotificationsInteractions,
      emailNotificationsNews: user.emailNotificationsNews
    })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = notificationPreferencesSchema.parse(body)

    const updateData: any = {}
    if (validatedData.emailNotificationsEnabled !== undefined) {
      updateData.emailNotificationsEnabled = validatedData.emailNotificationsEnabled
    }
    if (validatedData.emailNotificationsInteractions !== undefined) {
      updateData.emailNotificationsInteractions = validatedData.emailNotificationsInteractions
    }
    if (validatedData.emailNotificationsNews !== undefined) {
      updateData.emailNotificationsNews = validatedData.emailNotificationsNews
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        emailNotificationsEnabled: true,
        emailNotificationsInteractions: true,
        emailNotificationsNews: true
      }
    })

    return NextResponse.json({
      success: true,
      preferences: updatedUser
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

