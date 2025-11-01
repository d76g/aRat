
'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from './sidebar-provider'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { data: session } = useSession()
  const { isOpen, toggle } = useSidebar()
  const { t } = useLanguage()

  if (!session?.user) return null

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <Button
        onClick={toggle}
        variant="outline"
        size="sm"
        className={cn(
          "fixed top-24 z-50 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border-2 shadow-lg transition-all duration-300",
          isOpen ? "left-[120px]" : "left-2"
        )}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Sidebar - Fixed position */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200 
            }}
            className="fixed left-0 top-20 h-[calc(100vh-80px)] w-32 bg-background/95 backdrop-blur-sm border-r z-40 overflow-y-auto shadow-lg"
          >
            {/* Close Button - Absolutely positioned inside sidebar */}
            <Button
              onClick={toggle}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0 z-50"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="p-3 space-y-3 pt-10">
              <nav className="space-y-1">
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left h-8 text-xs hover:bg-primary/10"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    <span>{t('home')}</span>
                  </Button>
                </Link>
                
                <Link href="/projects/new">
                  <Button 
                    variant="default" 
                    className="w-full justify-start text-left h-8 bg-green-600 hover:bg-green-700 text-xs"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>{t('createProject')}</span>
                  </Button>
                </Link>
              </nav>

              <div className="pt-3 border-t">
                <div className="space-y-1">
                  <Link href={`/profile/${(session.user as any)?.username}`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8 hover:bg-primary/10">
                      {t('profile')}
                    </Button>
                  </Link>
                  <Link href={`/profile/${(session.user as any)?.username}/settings`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8 hover:bg-primary/10">
                      Settings
                    </Button>
                  </Link>
                  <Link href={`/profile/${(session.user as any)?.username}`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8 hover:bg-primary/10">
                      {t('myProjects')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  )
}
