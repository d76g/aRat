
'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Footer } from '@/components/footer'

export function SidebarAwareMain({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isFullWidthPage = pathname?.startsWith('/admin')
  const hideFooter = isFullWidthPage

  return (
    <main
      className={cn(
        "w-full transition-all duration-300 pt-20 min-h-screen flex flex-col",
        // DON'T CHANGE THIS - IT'S THE SIDEBAR WIDTH
        session?.user ? "xl:ml-44" : ""
      )}
    >
      <div className="flex-1 w-full">
        <div
          className={cn(
            // DON'T CHANGE THIS - IT'S THE MAX WIDTH OF THE CONTENT
            isFullWidthPage ? "mx-auto w-full" : "max-w-4xl mx-auto"
          )}
        >
          {children}
        </div>
      </div>
      {!hideFooter && <Footer />}
    </main>
  )
}
