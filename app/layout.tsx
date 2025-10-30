

import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { SidebarProvider } from '@/components/sidebar-provider'
import { SidebarAwareMain } from '@/components/sidebar-aware-main'
import { ApprovalStatusBanner } from '@/components/approval-status-banner'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export const metadata = {
  title: 'Prieelo - Scrap to Snap',
  description: 'Transform waste into wonderful - Share your DIY transformation journey',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Providers session={session}>
          <SidebarProvider>
            <div className="min-h-screen bg-gradient-to-br from-prieelo-cream via-white to-prieelo-blue/20">
              <Navbar />
              <ApprovalStatusBanner />
              <Sidebar />
              <SidebarAwareMain>
                {children}
              </SidebarAwareMain>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
