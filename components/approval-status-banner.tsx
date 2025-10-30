
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

interface UserStatus {
  isApproved: boolean
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  canPost: boolean
}

export function ApprovalStatusBanner() {
  const { data: session, status: sessionStatus } = useSession() || {}
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      fetchUserStatus()
    } else if (sessionStatus === 'unauthenticated') {
      setLoading(false)
    }
  }, [session, sessionStatus])

  const fetchUserStatus = async () => {
    try {
      const response = await fetch('/api/user/status')
      if (response.ok) {
        const data = await response.json()
        setUserStatus(data.user)
      }
    } catch (error) {
      console.error('Error fetching user status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show anything while loading or if user is not authenticated
  if (loading || sessionStatus !== 'authenticated' || !userStatus) {
    return null
  }

  // Don't show banner if user is approved
  if (userStatus.canPost) {
    return null
  }

  // Show appropriate message based on status
  const getStatusConfig = () => {
    switch (userStatus.status) {
      case 'PENDING':
        return {
          icon: <Clock className="h-5 w-5" />,
          title: 'Account Pending Approval',
          description: 'Your account is awaiting admin approval. You can browse content, but you cannot create projects or posts yet. You will be notified once your account is approved.',
          variant: 'default' as const,
          className: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
        }
      case 'REJECTED':
        return {
          icon: <XCircle className="h-5 w-5" />,
          title: 'Account Rejected',
          description: 'Your account application was not approved. Please contact support for more information.',
          variant: 'destructive' as const,
          className: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        }
      case 'SUSPENDED':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: 'Account Suspended',
          description: 'Your account has been suspended. Please contact support for assistance.',
          variant: 'destructive' as const,
          className: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
        }
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: 'Account Status Unknown',
          description: 'There is an issue with your account status. Please contact support.',
          variant: 'default' as const,
          className: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="w-full px-4 py-3">
      <Alert variant={config.variant} className={config.className}>
        <div className="flex items-start gap-3">
          {config.icon}
          <div className="flex-1">
            <AlertTitle className="mb-1">{config.title}</AlertTitle>
            <AlertDescription>{config.description}</AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  )
}
