
'use client'

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
      "transition-all duration-300 pt-20",
      session && isOpen ? "pl-4" : "",
      !session ? "w-full" : ""
    )}>
      <div className={cn(
        "transition-all duration-300 w-full",
        session && isOpen ? "lg:ml-32" : "",
        session && !isOpen ? "ml-0" : ""
      )}>
        {children}
      </div>
    </main>
  )
}
