

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
  icons: {
    icon: '/prieelo-mark.png',
  },
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
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Providers session={session}>
          <SidebarProvider>
            <div className="min-h-screen bg-gradient-to-br from-prieelo-cream via-white to-prieelo-blue/20">
              <Navbar />
              <Sidebar />
              <SidebarAwareMain>
                <ApprovalStatusBanner />
                {children}
              </SidebarAwareMain>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
