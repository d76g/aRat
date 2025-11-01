import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, getPasswordResetEmailTemplate } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Don't reveal if user exists or not for security
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store token in VerificationToken table
    // Use email as identifier and token as the reset token
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email,
          token: resetToken
        }
      },
      create: {
        identifier: email,
        token: resetToken,
        expires: resetTokenExpiry
      },
      update: {
        token: resetToken,
        expires: resetTokenExpiry
      }
    })

    // Generate reset URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Send reset email
    try {
      const emailTemplate = getPasswordResetEmailTemplate(user.firstName || 'User', resetUrl)
      await sendEmail({
        to: email,
        subject: 'Reset Your Prieelo Password',
        html: emailTemplate
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Don't reveal email sending failure to user
    }

    // Always return success message (security best practice)
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
  } catch (error) {
    console.error('Error processing forgot password request:', error)
    return NextResponse.json(
      { message: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

