import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { getFileUrl } from '@/lib/local-storage'
import { uploadFile } from '@/lib/local-storage'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string  
    const bio = formData.get('bio') as string
    const email = formData.get('email') as string
    const avatarFile = formData.get('avatar') as File | null

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          NOT: { id: session.user.id }
        }
      })
      
      if (existingUser) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 })
      }
    }

    let avatarUrl = undefined

    // Handle avatar upload
    if (avatarFile) {
      try {
        const buffer = Buffer.from(await avatarFile.arrayBuffer())
        const fileName = 'avatar-' + session.user.id + '-' + Date.now() + '.' + avatarFile.name.split('.').pop()
        const cloudStoragePath = await uploadFile(buffer, fileName)
        avatarUrl = await getFileUrl(cloudStoragePath)
      } catch (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
      }
    }

    // Update user profile
    const updateData: any = {
      firstName: firstName || null,
      lastName: lastName || null,
      bio: bio || null,
      email: email
    }

    if (avatarUrl) {
      updateData.avatar = avatarUrl
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
