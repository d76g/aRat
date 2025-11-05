
import { prisma } from './db'
import { sendEmail, getLikeNotificationEmailTemplate, getCommentNotificationEmailTemplate, getUserApprovalEmailTemplate, getUserRejectionEmailTemplate } from './email'

/**
 * Send email notification when someone likes a project
 */
export async function sendProjectLikeNotification(
  projectId: string,
  likerId: string
) {
  try {
    // Get project owner and project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            username: true,
            emailNotificationsEnabled: true,
            emailNotificationsInteractions: true
          }
        }
      }
    })

    if (!project) return

    // Don't send notification if user liked their own content
    if (project.userId === likerId) return

    // Check if notifications are enabled
    if (!project.user.emailNotificationsEnabled || !project.user.emailNotificationsInteractions) {
      return
    }

    // Get liker details
    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: {
        username: true,
        firstName: true,
        lastName: true
      }
    })

    if (!liker) return

    const recipientName = project.user.firstName || project.user.username
    const likerName = liker.firstName || liker.username
    const contentUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/projects/${projectId}`

    const emailHtml = getLikeNotificationEmailTemplate(
      recipientName,
      project.user.username,
      likerName,
      liker.username,
      'project',
      project.title,
      contentUrl
    )

    await sendEmail({
      to: project.user.email,
      subject: `@${liker.username} liked your project "${project.title}"`,
      html: emailHtml
    })
  } catch (error) {
    console.error('Error sending project like notification:', error)
    // Don't throw - we don't want to break the like functionality if email fails
  }
}

/**
 * Send email notification when someone likes a post
 */
export async function sendPostLikeNotification(
  postId: string,
  likerId: string
) {
  try {
    // Get post and project owner details
    const post = await prisma.projectPhase.findUnique({
      where: { id: postId },
      include: {
        project: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                username: true,
                emailNotificationsEnabled: true,
                emailNotificationsInteractions: true
              }
            }
          }
        }
      }
    })

    if (!post) return

    // Don't send notification if user liked their own content
    if (post.project.userId === likerId) return

    // Check if notifications are enabled
    if (!post.project.user.emailNotificationsEnabled || !post.project.user.emailNotificationsInteractions) {
      return
    }

    // Get liker details
    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: {
        username: true,
        firstName: true,
        lastName: true
      }
    })

    if (!liker) return

    const recipientName = post.project.user.firstName || post.project.user.username
    const likerName = liker.firstName || liker.username
    const postTitle = post.title || post.phaseType || 'your post'
    const contentUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/projects/${post.projectId}`

    const emailHtml = getLikeNotificationEmailTemplate(
      recipientName,
      post.project.user.username,
      likerName,
      liker.username,
      'post',
      postTitle,
      contentUrl
    )

    await sendEmail({
      to: post.project.user.email,
      subject: `@${liker.username} liked your post`,
      html: emailHtml
    })
  } catch (error) {
    console.error('Error sending post like notification:', error)
    // Don't throw - we don't want to break the like functionality if email fails
  }
}

/**
 * Send email notification when someone comments on a project or post
 */
export async function sendCommentNotification(
  commentId: string,
  commenterId: string
) {
  try {
    // Get comment with related data
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        },
        project: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                username: true,
                emailNotificationsEnabled: true,
                emailNotificationsInteractions: true
              }
            }
          }
        },
        post: {
          include: {
            project: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    username: true,
                    emailNotificationsEnabled: true,
                    emailNotificationsInteractions: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!comment) return

    // Determine recipient (project owner or post owner)
    type Recipient = {
      id: string
      email: string
      firstName: string | null
      username: string
      emailNotificationsEnabled: boolean
      emailNotificationsInteractions: boolean
    }
    let recipient: Recipient | null = null
    let contentType: 'project' | 'post' = 'project'
    let contentTitle = ''
    let contentUrl = ''

    if (comment.projectId) {
      // Comment on project
      if (!comment.project) return
      recipient = comment.project.user
      
      // Don't send if commenting on own content
      if (recipient.id === commenterId) return
      
      // Check if notifications are enabled
      if (!recipient.emailNotificationsEnabled || !recipient.emailNotificationsInteractions) {
        return
      }

      contentType = 'project'
      contentTitle = comment.project.title || 'your project'
      contentUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/projects/${comment.projectId}`
    } else if (comment.postId && comment.post) {
      // Comment on post
      recipient = comment.post.project.user
      
      // Don't send if commenting on own content
      if (recipient.id === commenterId) return
      
      // Check if notifications are enabled
      if (!recipient.emailNotificationsEnabled || !recipient.emailNotificationsInteractions) {
        return
      }

      contentType = 'post'
      contentTitle = comment.post.title || comment.post.phaseType || 'your post'
      contentUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/projects/${comment.post.projectId}`
    } else {
      return
    }

    const recipientName = recipient.firstName || recipient.username
    const commenterName = comment.user.firstName || comment.user.username

    const emailHtml = getCommentNotificationEmailTemplate(
      recipientName,
      recipient.username,
      commenterName,
      comment.user.username,
      comment.content,
      contentType,
      contentTitle,
      contentUrl
    )

    await sendEmail({
      to: recipient.email,
      subject: `@${comment.user.username} commented on your ${contentType}`,
      html: emailHtml
    })
  } catch (error) {
    console.error('Error sending comment notification:', error)
    // Don't throw - we don't want to break the comment functionality if email fails
  }
}

/**
 * Send email notification when a user is approved
 */
export async function sendUserApprovalNotification(
  userId: string
) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        username: true,
        emailNotificationsEnabled: true
      }
    })

    if (!user || !user.email) return

    // We still send approval/rejection emails even if notifications are disabled
    // as these are important account status updates

    const recipientName = user.firstName || user.username

    const emailHtml = getUserApprovalEmailTemplate(
      recipientName,
      user.username
    )

    await sendEmail({
      to: user.email,
      subject: 'Welcome to Prieelo - Your Account Has Been Approved!',
      html: emailHtml
    })
  } catch (error) {
    console.error('Error sending user approval notification:', error)
    // Don't throw - we don't want to break the approval process if email fails
  }
}

/**
 * Send email notification when a user is rejected
 */
export async function sendUserRejectionNotification(
  userId: string,
  reason?: string
) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        username: true,
        emailNotificationsEnabled: true
      }
    })

    if (!user || !user.email) return

    // We still send approval/rejection emails even if notifications are disabled
    // as these are important account status updates

    const recipientName = user.firstName || user.username

    const emailHtml = getUserRejectionEmailTemplate(
      recipientName,
      user.username,
      reason
    )

    await sendEmail({
      to: user.email,
      subject: 'Prieelo Application Update',
      html: emailHtml
    })
  } catch (error) {
    console.error('Error sending user rejection notification:', error)
    // Don't throw - we don't want to break the rejection process if email fails
  }
}

