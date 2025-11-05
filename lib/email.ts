

import nodemailer from 'nodemailer'

// Create transporter with improved connection handling
// Uses all SMTP values from .env file
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587')
  
  // Use SMTP_SECURE if explicitly set, otherwise determine from port
  const isSecure = process.env.SMTP_SECURE 
    ? process.env.SMTP_SECURE === 'true' 
    : port === 465

  // Use SMTP_REJECT_UNAUTHORIZED from .env, default to true
  const rejectUnauthorized = process.env.SMTP_REJECT_UNAUTHORIZED 
    ? process.env.SMTP_REJECT_UNAUTHORIZED === 'true'
    : true

  // Timeout settings from .env or defaults
  const connectionTimeout = process.env.SMTP_CONNECTION_TIMEOUT 
    ? parseInt(process.env.SMTP_CONNECTION_TIMEOUT) 
    : 10000
  const greetingTimeout = process.env.SMTP_GREETING_TIMEOUT 
    ? parseInt(process.env.SMTP_GREETING_TIMEOUT) 
    : 10000
  const socketTimeout = process.env.SMTP_SOCKET_TIMEOUT 
    ? parseInt(process.env.SMTP_SOCKET_TIMEOUT) 
    : 10000

  // Connection pool settings from .env or defaults
  const maxConnections = process.env.SMTP_MAX_CONNECTIONS 
    ? parseInt(process.env.SMTP_MAX_CONNECTIONS) 
    : 1
  const maxMessages = process.env.SMTP_MAX_MESSAGES 
    ? parseInt(process.env.SMTP_MAX_MESSAGES) 
    : 3

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure, // true for 465 or if SMTP_SECURE=true
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      // Reject unauthorized certificates (from .env or default true)
      rejectUnauthorized
    },
    // Connection timeout settings (from .env or defaults)
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    // Retry configuration (from .env or defaults)
    pool: true,
    maxConnections,
    maxMessages
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
  // Check if email credentials are configured from .env file
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || 
      process.env.SMTP_USER === 'your_email@gmail.com' ||
      !process.env.SMTP_HOST) {
    console.log('Email service not configured in .env file, skipping email to:', options.to)
    console.log('Required SMTP variables in .env: SMTP_HOST, SMTP_USER, SMTP_PASS')
    return { success: true, messageId: 'email_not_configured_but_skipped' }
  }

  try {
    // Create a new transporter instance for this request to avoid connection pooling issues
    const transport = createTransporter()
    
    const info = await Promise.race([
      transport.sendMail({
        from: process.env.SMTP_USER || 'team@prieelo.com',
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
    
    // Provide more specific error messages with .env values
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('SMTP connection failed. Please check your .env file:')
      console.error('  - SMTP_HOST:', process.env.SMTP_HOST || 'Not set')
      console.error('  - SMTP_PORT:', process.env.SMTP_PORT || 'Not set (default: 587)')
      console.error('  - SMTP_USER:', process.env.SMTP_USER ? 'Configured' : 'Missing')
      console.error('  - SMTP_PASS:', process.env.SMTP_PASS ? 'Configured' : 'Missing')
      console.error('  - SMTP_SECURE:', process.env.SMTP_SECURE || 'Auto (based on port)')
      console.error('  - Network connectivity to SMTP server')
    } else if (error.message?.includes('Greeting never received')) {
      console.error('SMTP server did not respond. This could indicate:')
      console.error('  - Incorrect SMTP_HOST:', process.env.SMTP_HOST || 'Not set')
      console.error('  - Incorrect SMTP_PORT:', process.env.SMTP_PORT || 'Not set')
      console.error('  - Firewall blocking the connection')
      console.error('  - SMTP server is down or unreachable')
    } else if (error.code === 'EAUTH') {
      console.error('SMTP authentication failed. Please check your .env file:')
      console.error('  - SMTP_USER:', process.env.SMTP_USER || 'Not set')
      console.error('  - SMTP_PASS:', process.env.SMTP_PASS ? 'Set (check if correct)' : 'Missing')
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

export function getLikeNotificationEmailTemplate(
  recipientName: string,
  recipientUsername: string,
  likerName: string,
  likerUsername: string,
  contentType: 'project' | 'post',
  contentTitle: string,
  contentUrl: string
) {
  const contentTypeLabel = contentType === 'project' ? 'project' : 'post'
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Someone Liked Your ${contentTypeLabel.charAt(0).toUpperCase() + contentTypeLabel.slice(1)} - Prieelo</title>
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
          color: #324426;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: #324426;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .highlight {
          background-color: #f6f8d8;
          padding: 20px;
          border-left: 4px solid #324426;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Prieelo</div>
        </div>
        
        <div class="content">
          <h2>Hello ${recipientName}!</h2>
          
          <p><strong>@${likerUsername}</strong> ${likerName ? `(${likerName})` : ''} liked your ${contentTypeLabel}:</p>
          
          <div class="highlight">
            <strong>${contentTitle}</strong>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contentUrl}" class="button">
              View ${contentType === 'project' ? 'Project' : 'Post'}
            </a>
          </div>
          
          <p>Keep up the great work! Your creativity is inspiring the community.</p>
          
          <p>Best regards,<br>
          The Prieelo Team</p>
        </div>
        
        <div class="footer">
          <p>You're receiving this because you have interaction notifications enabled.<br>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile/${recipientUsername}/settings">Manage your notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getCommentNotificationEmailTemplate(
  recipientName: string,
  recipientUsername: string,
  commenterName: string,
  commenterUsername: string,
  commentContent: string,
  contentType: 'project' | 'post',
  contentTitle: string,
  contentUrl: string
) {
  const contentTypeLabel = contentType === 'project' ? 'project' : 'post'
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Comment on Your ${contentTypeLabel.charAt(0).toUpperCase() + contentTypeLabel.slice(1)} - Prieelo</title>
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
          color: #324426;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: #324426;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .highlight {
          background-color: #f6f8d8;
          padding: 20px;
          border-left: 4px solid #324426;
          margin: 20px 0;
          border-radius: 4px;
        }
        .comment-box {
          background-color: #f9f9f9;
          padding: 15px;
          border-left: 3px solid #324426;
          margin: 20px 0;
          border-radius: 4px;
          font-style: italic;
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
        </div>
        
        <div class="content">
          <h2>Hello ${recipientName}!</h2>
          
          <p><strong>@${commenterUsername}</strong> ${commenterName ? `(${commenterName})` : ''} commented on your ${contentTypeLabel}:</p>
          
          <div class="highlight">
            <strong>${contentTitle}</strong>
          </div>
          
          <div class="comment-box">
            "${commentContent}"
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contentUrl}" class="button">
              View ${contentType === 'project' ? 'Project' : 'Post'} & Reply
            </a>
          </div>
          
          <p>Keep the conversation going!</p>
          
          <p>Best regards,<br>
          The Prieelo Team</p>
        </div>
        
        <div class="footer">
          <p>You're receiving this because you have interaction notifications enabled.<br>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile/${recipientUsername}/settings">Manage your notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getNewsNotificationEmailTemplate(
  recipientName: string,
  recipientUsername: string,
  newsTitle: string,
  newsContent: string,
  newsUrl?: string
) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${newsTitle} - Prieelo</title>
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
          color: #324426;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: #324426;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .highlight {
          background-color: #f6f8d8;
          padding: 20px;
          border-left: 4px solid #324426;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Prieelo</div>
        </div>
        
        <div class="content">
          <h2>Hello ${recipientName}!</h2>
          
          <h3>${newsTitle}</h3>
          
          <div class="highlight">
            ${newsContent}
          </div>
          
          ${newsUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${newsUrl}" class="button">
              Read More
            </a>
          </div>
          ` : ''}
          
          <p>Best regards,<br>
          The Prieelo Team</p>
        </div>
        
        <div class="footer">
          <p>You're receiving this because you have news notifications enabled.<br>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile/${recipientUsername}/settings">Manage your notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getUserApprovalEmailTemplate(
  recipientName: string,
  recipientUsername: string
) {
  const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin`
  const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Prieelo - Your Account Has Been Approved!</title>
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
          color: #324426;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: #324426;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .highlight {
          background-color: #f6f8d8;
          padding: 20px;
          border-left: 4px solid #324426;
          margin: 20px 0;
          border-radius: 4px;
        }
        .success-icon {
          text-align: center;
          font-size: 48px;
          margin-bottom: 20px;
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
        </div>
        
        <div class="content">
          <div class="success-icon">🎉</div>
          <h2>Hello ${recipientName}!</h2>
          
          <p>Great news! Your application to join Prieelo has been <strong>approved</strong>!</p>
          
          <div class="highlight">
            <strong>Welcome to the Prieelo community!</strong> You can now start creating projects, sharing your work, and connecting with fellow Remakers.
          </div>
          
          <p>As an approved Remaker, you can:</p>
          <ul style="line-height: 2;">
            <li>✨ Create and share your projects</li>
            <li>📸 Add posts to document your creative process</li>
            <li>💬 Engage with the community through comments and likes</li>
            <li>🔍 Explore and discover amazing work from other Remakers</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button">
              Sign In to Get Started
            </a>
          </div>
          
          <p>We're excited to see what you'll create! Start sharing your transformations and inspiring others in the community.</p>
          
          <p>Best regards,<br>
          The Prieelo Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent because your Prieelo account has been approved.<br>
          If you have any questions, please contact us at support@prieelo.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getUserRejectionEmailTemplate(
  recipientName: string,
  recipientUsername: string,
  reason?: string
) {
  const supportEmail = 'support@prieelo.com'
  const reapplyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/become-remaker`
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prieelo Application Update</title>
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
          color: #324426;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: #324426;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .highlight {
          background-color: #fff3cd;
          padding: 20px;
          border-left: 4px solid #ffc107;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box {
          background-color: #f6f8d8;
          padding: 20px;
          border-left: 4px solid #324426;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Prieelo</div>
        </div>
        
        <div class="content">
          <h2>Hello ${recipientName},</h2>
          
          <p>Thank you for your interest in joining Prieelo. After careful review, we're unable to approve your application at this time.</p>
          
          ${reason ? `
          <div class="highlight">
            <strong>Reason:</strong><br>
            ${reason}
          </div>
          ` : ''}
          
          <div class="info-box">
            <strong>What's Next?</strong><br>
            <p style="margin-top: 10px;">We understand this may be disappointing. If you believe this decision was made in error, or if you'd like to reapply with additional information, please don't hesitate to contact us.</p>
          </div>
          
          <p>You can:</p>
          <ul style="line-height: 2;">
            <li>📧 Contact our support team at <a href="mailto:${supportEmail}" style="color: #324426;">${supportEmail}</a> for more information</li>
            <li>🔄 Reapply in the future if your circumstances change</li>
            <li>💬 Reach out if you have questions about the decision</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${supportEmail}" class="button">
              Contact Support
            </a>
          </div>
          
          <p>We appreciate your interest in Prieelo and wish you the best with your creative endeavors.</p>
          
          <p>Best regards,<br>
          The Prieelo Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent regarding your Prieelo application.<br>
          If you have any questions, please contact us at ${supportEmail}</p>
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

