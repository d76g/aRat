
'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/language-provider'
import { LanguageSelector } from '@/components/language-selector'

export function Navbar() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const [isAdmin, setIsAdmin] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/profile/me')
          if (response.ok) {
            const userData = await response.json()
            setIsAdmin(userData.user?.isAdmin || false)
            setAvatar(userData.user?.avatar || null)
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error)
        }
      } else {
        setAvatar(null)
      }
    }

    fetchUserData()
  }, [session])

  if (status === 'loading') {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl flex h-20 items-center justify-between px-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-20">
      <div className="container mx-auto max-w-6xl px-4 h-full">
        {session ? (
          // Signed in layout - keep horizontal
          <div className="flex h-full items-center justify-between">
            <Link href="/" className="flex flex-col items-center">
              <img src="/prieelo-logo.png" alt="Prieelo" className="h-[2.8rem] w-auto" />
            </Link>

            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <LanguageSelector />

              {/* Admin Link - Only show for admin users */}
              {isAdmin && (
                <Link href="/admin">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {t('moderationPanel')}
                  </Button>
                </Link>
              )}

              {/* Profile Icon - Direct Link */}
              <Link href={`/profile/${(session?.user as any)?.username}`}>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full" 
                  aria-label={t('profile')}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatar || ''} alt={session?.user?.name || 'User'} />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0)?.toUpperCase() || (session?.user as any)?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>

              {/* Sign Out Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut()}
                className="text-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('signOut')}
              </Button>
            </div>
          </div>
        ) : (
          // Signed out layout - horizontal with same logo size, mobile responsive
          <div className="flex h-full items-center justify-between">
            <Link href="/" className="flex flex-col items-center">
              <img src="/prieelo-logo.png" alt="Prieelo" className="h-[2.8rem] w-auto" />
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Language Selector */}
              <LanguageSelector />

              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">{t('signIn')}</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="text-xs sm:text-sm">{t('signUp')}</Button>
                </Link>
              </div>
              <Link href="https://form.typeform.com/to/tS5qFUcs" target="_blank" className="hidden sm:block">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm">
                  Become a Remaker
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
