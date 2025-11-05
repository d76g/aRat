
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { HomeFeed } from '@/components/home-feed'
import { PublicFeed } from '@/components/public-feed'
import { Footer } from '@/components/footer'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {!session?.user ? <PublicFeed /> : <HomeFeed />}
      </div>
      <Footer />
    </div>
  )
}
