

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, projectDescription, experience, motivation } = await request.json()

    if (!email || !projectDescription || !experience || !motivation) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'No account found with this email. Please sign up first.' },
        { status: 400 }
      )
    }

    // Update user with application details (store in bio field temporarily or create new fields)
    const applicationData = {
      projectDescription,
      experience,
      motivation,
      submittedAt: new Date().toISOString()
    }

    await prisma.user.update({
      where: { email },
      data: {
        bio: JSON.stringify(applicationData), // Store application data in bio field
        // Keep status as PENDING until admin reviews
      }
    })

    // Send notification email to admins
    try {
      const adminUsers = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { email: true }
      })

      const adminEmails = adminUsers.map(admin => admin.email)
      
      for (const adminEmail of adminEmails) {
        await sendEmail({
          to: adminEmail,
          subject: 'New Remaker Application - Prieelo',
          html: `
            <h2>New Remaker Application</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Project Description:</strong> ${projectDescription}</p>
            <p><strong>Experience:</strong> ${experience}</p>
            <p><strong>Motivation:</strong> ${motivation}</p>
            <p><a href="${process.env.NEXTAUTH_URL}/admin">Review Application</a></p>
          `
        })
      }
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError)
    }

    return NextResponse.json({
      message: 'Application submitted successfully! Our team will review it soon.',
    })
  } catch (error) {
    console.error('Become remaker application error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

