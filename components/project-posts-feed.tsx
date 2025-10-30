

'use client'

import { useEffect, useState } from 'react'
import { ProjectPhase } from '@/lib/types'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

interface ProjectPostsFeedProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    userId: string;
    isPublic: boolean;
    user: {
      id: string;
      username: string;
      firstName: string | null;
      lastName: string | null;
      avatar?: string | null;
    };
  };
  currentUserId?: string;
}

export function ProjectPostsFeed({ project, currentUserId }: ProjectPostsFeedProps) {
  const [posts, setPosts] = useState<PostWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const loadPosts = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/posts/feed?projectId=${project.id}`)
      
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
  }, [project.id])

  const handleRefresh = () => {
    setRefreshing(true)
    loadPosts()
  }

  const handleLike = (projectId: string, postId: string | null, isLiked: boolean) => {
    if (postId) {
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
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="flex items-center space-x-3 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.user.avatar ?? ''} />
                <AvatarFallback className="text-xs">
                  {project.user.username?.charAt(0)?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <Link 
                href={`/profile/${project.user.username}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                @{project.user.username}
              </Link>
              {!project.isPublic && (
                <Badge variant="outline" className="text-xs">
                  Private
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
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
            <h3 className="text-lg font-semibold mb-2">No posts in this project yet</h3>
            <p className="text-muted-foreground">
              {project.userId === currentUserId 
                ? "Start by adding posts to share your transformation journey!"
                : "Check back later for updates on this project."
              }
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
                isPostView={true}
                isDoubleSize={true}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

