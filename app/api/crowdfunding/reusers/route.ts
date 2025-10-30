
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // For now, we'll just log the email. 
    // Later you can integrate with your preferred email service
    console.log('New reuser signup:', email)

    // You can also save to database if needed
    // await saveToDatabase({ email, type: 'reuser', createdAt: new Date() })

    // Send notification email to info@arat.eco
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'default_service',
        template_id: 'reuser_signup',
        user_id: 'your_user_id',
        template_params: {
          to_email: 'info@arat.eco',
          reuser_email: email,
          subject: 'New Reuser Signup - Christmas Campaign',
          message: `New reuser signed up for Christmas campaign: ${email}`,
        }
      })
    }).catch(err => {
      console.log('Email notification failed:', err)
      // Don't fail the request if email fails
    })

    return NextResponse.json(
      { message: 'Successfully registered for Christmas campaign updates!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing reuser signup:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}
