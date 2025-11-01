

import nodemailer from 'nodemailer'

// Create transporter with improved connection handling
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587')
  const isSecure = port === 465

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      // Reject unauthorized certificates (set to false only if using self-signed certs)
      rejectUnauthorized: true
    },
    // Connection timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    // Retry configuration
    pool: true,
    maxConnections: 1,
    maxMessages: 3
  })
}

// Create transporter instance
const transporter = createTransporter()

// Verify connection on startup (non-blocking)
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP connection verification failed:', error.message)
      console.error('This may indicate SMTP configuration issues. Emails may not send.')
    } else {
      console.log('✅ SMTP server is ready to send emails')
    }
  })
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions) {
  // Check if email credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || 
      process.env.SMTP_USER === 'your_email@gmail.com') {
    console.log('Email service not configured, skipping email to:', options.to)
    return { success: true, messageId: 'email_not_configured_but_skipped' }
  }

  try {
    // Create a new transporter instance for this request to avoid connection pooling issues
    const transport = createTransporter()
    
    const info = await Promise.race([
      transport.sendMail({
        from: process.env.SMTP_FROM || 'noreply@prieelo.com',
        to: options.to,
        subject: options.subject,
        html: options.html
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout after 15 seconds')), 15000)
      )
    ]) as any

    // Close the transport connection
    transport.close()

    console.log('Email sent successfully: %s', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Error sending email:', error.message || error)
    
    // Provide more specific error messages
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('SMTP connection failed. Please check:')
      console.error('  - SMTP_HOST:', process.env.SMTP_HOST)
      console.error('  - SMTP_PORT:', process.env.SMTP_PORT)
      console.error('  - SMTP_USER:', process.env.SMTP_USER ? 'Configured' : 'Missing')
      console.error('  - Network connectivity to SMTP server')
    } else if (error.message?.includes('Greeting never received')) {
      console.error('SMTP server did not respond. This could indicate:')
      console.error('  - Incorrect SMTP_HOST or SMTP_PORT')
      console.error('  - Firewall blocking the connection')
      console.error('  - SMTP server is down or unreachable')
    }

    return { success: false, error: error.message || 'Failed to send email' }
  }
}

export function getPasswordResetEmailTemplate(firstName?: string, resetUrl?: string) {
  const name = firstName ? `, ${firstName}` : ''
  const buttonUrl = resetUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password`
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Prieelo</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .highlight {
          background-color: #f0f4ff;
          padding: 20px;
          border-left: 4px solid #6366f1;
          margin: 20px 0;
        }
        .warning {
          background-color: #fff3cd;
          padding: 15px;
          border-left: 4px solid #ffc107;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }
        .token-info {
          font-size: 12px;
          color: #999;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Prieelo</div>
          <div class="subtitle">Reset Your Password</div>
        </div>
        
        <div class="content">
          <h2>Hello${name}!</h2>
          
          <p>We received a request to reset your password for your Prieelo account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div class="highlight">
            <strong>To reset your password, click the button below:</strong>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${buttonUrl}" class="button">
              🔑 Reset Password
            </a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security. If you need a new link, please request another password reset.
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6366f1; font-size: 12px;">${buttonUrl}</p>
          
          <p class="token-info">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
          </p>
          
          <p>Best regards,<br>
          The Prieelo Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent because a password reset was requested for your Prieelo account.<br>
          If you have any questions, please contact us at support@prieelo.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getBecomeRemakerEmailTemplate(firstName?: string, joinUrl?: string) {
  const name = firstName ? `, ${firstName}` : ''
  const buttonUrl = joinUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/become-remaker`
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Prieelo - Become a Remaker</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .highlight {
          background-color: #f0f4ff;
          padding: 20px;
          border-left: 4px solid #6366f1;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Prieelo</div>
          <div class="subtitle">The Creative Community for Remakers</div>
        </div>
        
        <div class="content">
          <h2>Hello${name}!</h2>
          
          <p>Thank you for your interest in joining Prieelo! We're excited that you want to be part of our creative community.</p>
          
          <div class="highlight">
            <strong>Prieelo is not available to the public yet</strong>, but if you <strong>Re-purpose</strong>, <strong>Re-cycle</strong>, or <strong>Re-design</strong>, then you might qualify to be a <strong>Remaker</strong>.
          </div>
          
          <p>Our platform is designed for creative individuals who transform the ordinary into extraordinary. Whether you're upcycling furniture, repurposing materials, or redesigning everyday objects, we want to see your amazing work!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${buttonUrl}" class="button">
              🔨 Become a Remaker
            </a>
          </div>
          
          <p>Click the button above to complete your application and join our exclusive community of Remakers.</p>
          
          <p>Stay tuned for our public launch, and feel free to check out the incredible work our current Remakers are sharing on the platform!</p>
          
          <p>Can't wait to see what you create!</p>
          
          <p>Best regards,<br>
          The Prieelo Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent because you signed up for a Prieelo account.<br>
          If you have any questions, please contact us at support@prieelo.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}

