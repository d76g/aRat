
'use client'

import { useEffect, useState } from 'react'
import { ProjectPhase } from '@/lib/types'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

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

export function HomeFeed() {
  const [posts, setPosts] = useState<PostWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all-posts')
  const [refreshing, setRefreshing] = useState(false)

  const loadPosts = async () => {
    try {
      setError(null)
      const apiEndpoint = filter === 'all-posts' ? '/api/posts/feed' : '/api/projects/feed'
      const response = await fetch(`${apiEndpoint}?filter=${filter}`)
      
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

  const handleLike = (projectId: string, postId: string | null, isLiked: boolean) => {
    if (postId && filter === 'all-posts') {
      // Handle individual post like
      setPosts(prev => prev?.map(post => 
        post?.id === postId 
          ? { 
              ...post, 
              _count: { 
                likes: (post?._count?.likes || 0) + (isLiked ? 1 : -1),
                comments: post?._count?.comments || 0
              }
            }
          : post
      ) || [])
    } else {
      // Handle project like
      setPosts(prev => prev?.map(post => 
        post?.project?.id === projectId 
          ? { 
              ...post, 
              project: {
                ...post.project,
                _count: { 
                  likes: (post?.project?._count?.likes || 0) + (isLiked ? 1 : -1),
                  comments: post?.project?._count?.comments || 0
                } 
              }
            }
          : post
      ) || [])
    }
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
    <div className="container mx-auto max-w-4xl pr-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-black">
              {filter === 'all-posts' ? 'Posts' : 'Projects'}
            </h1>
            <p className="text-lg text-black/60">
              {filter === 'all-posts' 
                ? 'Discover amazing transformation posts'
                : 'Explore transformation projects'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-posts">All Posts</SelectItem>
                <SelectItem value="all-projects">All Projects</SelectItem>
                <SelectItem value="material">Raw 📦</SelectItem>
                <SelectItem value="process">Remaking 🔧</SelectItem>
                <SelectItem value="masterpiece">Reveal ✨</SelectItem>
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
              Try Again
            </Button>
          </div>
        )}

        {posts?.length === 0 && !error && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your transformation journey!
            </p>
          </div>
        )}

        <div className="grid gap-8">
          {posts?.map((post, index) => (
            <motion.div
              key={post?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PostCard
                post={post}
                onLike={handleLike}
                isPostView={filter === 'all-posts'}
                isDoubleSize={true}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
