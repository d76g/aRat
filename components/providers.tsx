
'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './theme-provider'
import { LanguageProvider } from './language-provider'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'

export function Providers({ 
  children,
  session
}: {
  children: React.ReactNode
  session: any
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <LanguageProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
