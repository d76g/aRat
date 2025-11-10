
'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Home, Plus, User, Settings, Layers, BookOpen, Shield, LogOut } from 'lucide-react'
import { useSidebar } from './sidebar-provider'
import { useLanguage } from '@/components/language-provider'
import { LanguageSelector } from '@/components/language-selector'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { data: session } = useSession()
  const { isOpen, toggle } = useSidebar()
  const { t } = useLanguage()
  const [isAdmin, setIsAdmin] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) {
        setIsAdmin(false)
        setAvatar(null)
        return
      }

      try {
        const response = await fetch('/api/profile/me')
        if (response.ok) {
          const userData = await response.json()
          setIsAdmin(userData.user?.isAdmin || false)
          setAvatar(userData.user?.avatar || null)
        } else {
          setIsAdmin(false)
          setAvatar(null)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        setIsAdmin(false)
        setAvatar(null)
      }
    }

    fetchUserData()
  }, [session?.user?.id])

  if (!session?.user) return null

  const username = (session.user as any)?.username
  const displayName = session.user?.name || username
  const baseLinkClasses =
    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200'

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-20 left-0 z-40 w-64 h-[calc(100vh-5rem)] transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0',
          'bg-[#324426] text-[#f6f6d6] border-r border-white/10 shadow-2xl xl:shadow-none'
        )}
        aria-label="Sidebar"
      >
        <div className="h-full px-5 pb-4 pt-6 overflow-y-auto flex flex-col">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-[#a1c0e5]">Welcome</p>
            <p className="mt-1 text-base font-semibold truncate">{displayName}</p>
            {username && (
              <p className="text-sm text-[#f6f6d6]/70 truncate">@{username}</p>
            )}
          </div>

          <div className="space-y-6 flex-1">
            <nav className="space-y-2 font-medium">
              <Link
                href="/"
                className={cn(baseLinkClasses, 'hover:bg-white/10 text-[#f6f6d6]')}
                onClick={toggle}
              >
                <Home className="h-4 w-4" />
                <span>{t('home')}</span>
              </Link>

              <Link
                href="/projects/new"
                className={cn(
                  baseLinkClasses,
                  'bg-[#f6f6d6] text-[#324426] shadow-sm hover:bg-[#f6f8d8]'
                )}
                onClick={toggle}
              >
                <Plus className="h-4 w-4" />
                <span>{t('createProject')}</span>
              </Link>

              <Link
                href="https://prieelo.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  baseLinkClasses,
                  'bg-[#293820] border border-white/10 text-[#f6f6d6] hover:bg-[#3b4f2f]'
                )}
                onClick={toggle}
              >
                <BookOpen className="h-4 w-4" />
                <span>How Prieelo Works</span>
              </Link>
            </nav>

            <div>
              <p className="px-3 text-xs uppercase tracking-widest text-[#a1c0e5]/80 mb-3">
                {t('profile')}
              </p>
              <div className="space-y-2 font-medium">
                <Link
                  href={`/profile/${username}`}
                  className={cn(baseLinkClasses, 'hover:bg-white/10 text-[#f6f6d6]')}
                  onClick={toggle}
                >
                  <User className="h-4 w-4" />
                  <span>{t('profile')}</span>
                </Link>

                <Link
                  href={`/profile/${username}/settings`}
                  className={cn(baseLinkClasses, 'hover:bg-white/10 text-[#f6f6d6]')}
                  onClick={toggle}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>

                <Link
                  href={`/profile/${username}`}
                  className={cn(baseLinkClasses, 'hover:bg-white/10 text-[#f6f6d6]')}
                  onClick={toggle}
                >
                  <Layers className="h-4 w-4" />
                  <span>{t('myProjects')}</span>
                </Link>
              </div>
            </div>

            {isAdmin && (
              <div>
                <p className="px-3 text-xs uppercase tracking-widest text-[#a1c0e5]/80 mb-3">
                  Admin
                </p>
                <div className="space-y-2 font-medium">
                  <Link
                    href="/admin"
                    className={cn(baseLinkClasses, 'hover:bg-white/10 text-[#f6f6d6]')}
                    onClick={toggle}
                  >
                    <Shield className="h-4 w-4" />
                    <span>{t('moderationPanel')}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section - Mobile & Tablet */}
          <div className="xl:hidden pt-4 border-t border-white/10 space-y-3 mt-auto">
            {/* Language Selector */}
            <div className="px-3">
              <LanguageSelector />
            </div>

            {/* Profile Card with Avatar */}
            <Link
              href={`/profile/${username}`}
              className={cn(
                baseLinkClasses,
                'hover:bg-white/10 text-[#f6f6d6]',
                'flex items-center gap-3'
              )}
              onClick={toggle}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar || ''} alt={session?.user?.name || 'User'} />
                <AvatarFallback className="bg-[#f6f6d6] text-[#324426] text-sm">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-[#f6f6d6]/70 truncate">View Profile</p>
              </div>
            </Link>

            {/* Sign Out Button */}
            <Button
              onClick={() => {
                toggle()
                signOut()
              }}
              className={cn(
                baseLinkClasses,
                'w-full justify-start hover:bg-white/10 bg-transparent text-[#f6f6d6]'
              )}
              variant="ghost"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('signOut')}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile & tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm xl:hidden"
          onClick={toggle}
          aria-hidden="true"
        />
      )}
    </>
  )
}
