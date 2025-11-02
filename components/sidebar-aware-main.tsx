
'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useSidebar } from './sidebar-provider'
import { cn } from '@/lib/utils'

export function SidebarAwareMain({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { data: session } = useSession()
  const { isOpen } = useSidebar()

  return (
    <main className={cn(
      "transition-all duration-300 pt-20 w-full",
      session && isOpen ? "lg:pl-36" : ""
    )}>
      <div className="w-full">
        {children}
      </div>
    </main>
  )
}
