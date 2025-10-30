
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendEmail, getBecomeRemakerEmailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, firstName, lastName } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json(
        { message: 'Email, password and username are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: existingUser.email === email ? 'Email already registered' : 'Username already taken' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with PENDING status by default
    // Users need admin approval before they can post content
    // They can still view content while pending approval
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        firstName: firstName || null,
        lastName: lastName || null,
        isApproved: false,
        status: 'PENDING' // Require admin approval
      }
    })

    // Send "Become a Remaker" email
    try {
      const emailTemplate = getBecomeRemakerEmailTemplate(firstName)
      await sendEmail({
        to: email,
        subject: 'Welcome to Prieelo - Become a Remaker! 🔨',
        html: emailTemplate
      })
      console.log('Welcome email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail signup if email fails - just log it
    }

    return NextResponse.json({
      message: 'Account created successfully! Check your email to become a Remaker.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        status: user.status
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
