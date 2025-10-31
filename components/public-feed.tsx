
'use client'

import { useEffect, useState } from 'react'
import { ProjectPhase } from '@/lib/types'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/components/language-provider'

interface PostWithProject extends ProjectPhase {
  project: {
    id: string;
    title: string;
    description: string;
    userId: string;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    _count: {
      likes: number;
      comments: number;
    };
    likes: any[];
  };
  _count?: {
    likes: number;
    comments: number;
  };
  likes?: any[];
}

export function PublicFeed() {
  const { t } = useLanguage()
  const [posts, setPosts] = useState<PostWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all-posts')
  const [refreshing, setRefreshing] = useState(false)

  const loadPosts = async () => {
    try {
      setError(null)
      const apiEndpoint = filter === 'all-posts' ? '/api/posts/feed' : '/api/projects/feed'
      const response = await fetch(`${apiEndpoint}?filter=${filter}&public=true`)
      
      if (!response?.ok) {
        throw new Error('Failed to load posts')
      }
      
      const data = await response.json()
      setPosts(data?.posts || [])
    } catch (error) {
      console.error('Error loading posts:', error)
      setError('Failed to load posts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [filter])

  const handleRefresh = () => {
    setRefreshing(true)
    loadPosts()
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-8">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
              {filter === 'all-posts' ? t('latestPosts') : t('projects')}
            </h1>
            <p className="text-sm sm:text-lg text-black/60">
              {filter === 'all-posts' 
                ? t('discoverPosts')
                : t('exploreProjects')
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-posts">{t('allPosts')}</SelectItem>
                <SelectItem value="all-projects">{t('allProjects')}</SelectItem>
                <SelectItem value="material">{t('raw')}</SelectItem>
                <SelectItem value="process">{t('remaking')}</SelectItem>
                <SelectItem value="masterpiece">{t('reveal')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadPosts} variant="outline">
              {t('tryAgain')}
            </Button>
          </div>
        )}

        {posts?.length === 0 && !error && (
          <div className="text-center py-8 sm:py-12">
            <h3 className="text-lg font-semibold mb-2">{t('noPublicPosts')}</h3>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              {t('beFirstToShare')}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto text-center">
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-base sm:text-lg">📦</span>
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base">{t('raw')}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('rawDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-base sm:text-lg">🔧</span>
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base">{t('remaking')}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('remakingDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-base sm:text-lg">✨</span>
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base">{t('reveal')}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('revealDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 md:gap-8">
          {posts?.map((post, index) => (
            <motion.div
              key={post?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PostCard
                post={post}
                onLike={(projectId, postId, isLiked) => {
                  // Update the post in the local state to reflect the like change
                  setPosts(prevPosts => 
                    prevPosts.map(p => {
                      if (p.id === post.id) {
                        const updatedPost = { ...p }
                        if (filter === 'all-posts' && postId) {
                          // Update post likes
                          updatedPost._count = {
                            ...updatedPost._count,
                            likes: (updatedPost._count?.likes || 0) + (isLiked ? 1 : -1)
                          }
                        } else {
                          // Update project likes
                          updatedPost.project._count = {
                            ...updatedPost.project._count,
                            likes: updatedPost.project._count.likes + (isLiked ? 1 : -1)
                          }
                        }
                        return updatedPost
                      }
                      return p
                    })
                  )
                }}
                isPostView={filter === 'all-posts'}
                isDoubleSize={true}
                isPublic={true}
              />
            </motion.div>
          ))}
        </div>

        {/* Contact Information Footer */}
        <div className="mt-12 py-8 border-t border-gray-200 text-center">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('wantToJoin')}
            </h3>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              {t('prieeloCommunity')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
              <span>{t('reachOutEmail')}</span>
              <a 
                href="mailto:info@arat.eco" 
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                info@arat.eco
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
