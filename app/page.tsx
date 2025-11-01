
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { HomeFeed } from '@/components/home-feed'
import { PublicFeed } from '@/components/public-feed'
import { Footer } from '@/components/footer'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <>
      {!session?.user ? <PublicFeed /> : <HomeFeed />}
      <Footer />
    </>
  )
}
