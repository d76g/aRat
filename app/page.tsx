
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { HomeFeed } from '@/components/home-feed'
import { PublicFeed } from '@/components/public-feed'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <PublicFeed />
  }

  return <HomeFeed />
}
