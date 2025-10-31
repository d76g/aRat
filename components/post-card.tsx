

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectPhase } from '@/lib/types'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heart, MessageCircle, Share2, User, Edit3, Send } from 'lucide-react'
import Link from 'next/link'
import { LocalImage } from '@/components/local-image'
import { motion } from 'framer-motion'
import { PHASE_LABELS } from '@/lib/types'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface PostCardProps {
  post: ProjectPhase & {
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
  };
  onLike?: (projectId: string, postId: string | null, isLiked: boolean) => void;
  onShare?: (projectId: string) => void;
  showEdit?: boolean;
  isPostView?: boolean;
  isDoubleSize?: boolean;
  isPublic?: boolean;
}

export function PostCard({ 
  post, 
  onLike, 
  onShare, 
  showEdit = false, 
  isPostView = false,
  isDoubleSize = false,
  isPublic = false 
}: PostCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  
  // Handle both post and project likes
  const [isLiked, setIsLiked] = useState(() => {
    if (isPostView && post?.likes) {
      return post.likes.some(like => like?.userId === session?.user?.id)
    }
    return post?.project?.likes?.some(like => like?.userId === session?.user?.id) ?? false
  })
  
  const [likeCount, setLikeCount] = useState(() => {
    if (isPostView && post?._count) {
      return post._count.likes ?? 0
    }
    return post?.project?._count?.likes ?? 0
  })
  
  const [commentCount, setCommentCount] = useState(() => {
    if (isPostView && post?._count) {
      return post._count.comments ?? 0
    }
    return post?.project?._count?.comments ?? 0
  })
  
  const [isLiking, setIsLiking] = useState(false)

  const mainImage = post?.images?.[0]
  const isOwner = post?.project?.userId === session?.user?.id

  const loadComments = async () => {
    if (!isPostView) return
    
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    if (showComments && isPostView) {
      loadComments()
    }
  }, [showComments, isPostView, post.id])

  const handleLike = async () => {
    if (isLiking) return
    
    if (!session?.user?.id) {
      if (isPublic) {
        toast.error('Please sign in to like posts')
        router.push('/auth/signin')
        return
      }
      toast.error('Please sign up to like posts')
      return
    }
    
    setIsLiking(true)
    try {
      const endpoint = isPostView ? '/api/posts/like' : '/api/projects/like'
      const body = isPostView 
        ? { postId: post.id }
        : { projectId: post?.project?.id }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response?.ok) {
        const newIsLiked = !isLiked
        setIsLiked(newIsLiked)
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
        onLike?.(post?.project?.id, isPostView ? post.id : null, newIsLiked)
      } else {
        const data = await response.json()
        toast.error(data?.error || data?.message || 'Failed to like post')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim() || isCommenting || !isPostView) return
    
    if (!session?.user?.id) {
      if (isPublic) {
        toast.error('Please sign in to comment on posts')
        router.push('/auth/signin')
        return
      }
      toast.error('Please sign up to comment on posts')
      return
    }
    
    setIsCommenting(true)
    try {
      const response = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, content: newComment.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data.comment, ...prev])
        setCommentCount(prev => prev + 1)
        setNewComment('')
        toast.success('Comment added!')
      } else {
        const data = await response.json()
        toast.error(data?.error || 'Failed to add comment')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsCommenting(false)
    }
  }

  const handleShare = async () => {
    try {
      const url = isPostView 
        ? `${window?.location?.origin}/projects/${post?.project?.id}`
        : `${window?.location?.origin}/projects/${post?.project?.id}`
      
      if (navigator?.share) {
        await navigator.share({
          title: post?.title ?? post?.project?.title ?? 'Check out this post',
          text: post?.description ?? 'Amazing transformation on Prieelo!',
          url
        })
      } else {
        await navigator?.clipboard?.writeText(url)
        toast.success('Link copied to clipboard!')
      }
      onShare?.(post?.project?.id)
    } catch (error) {
      // User cancelled sharing or clipboard failed
    }
  }

  const aspectRatio = isDoubleSize ? "aspect-[2/1]" : "aspect-[4/3]"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative">
          {mainImage ? (
            <div className={`relative ${aspectRatio} bg-muted`}>
              <LocalImage
                src={mainImage}
                alt={post?.title ?? post?.project?.title ?? 'Post image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                cacheBust={new Date(post?.updatedAt ?? Date.now()).getTime()}
              />
              {/* Project name overlay on top left - clickable */}
              <Link href={`/projects/${post?.project?.id}`}>
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md hover:bg-black/80 transition-colors cursor-pointer">
                  <p className="text-sm font-medium line-clamp-1 max-w-[200px]">
                    {post?.project?.title}
                  </p>
                </div>
              </Link>
              {post?.images && post.images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md">
                  <p className="text-xs">+{post.images.length - 1} more</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`${aspectRatio} bg-muted flex items-center justify-center`}>
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant={post?.phaseType === 'masterpiece' ? 'default' : 'secondary'}>
              {PHASE_LABELS[post?.phaseType ?? 'material']}
            </Badge>
            {post?.isPublic === false && (
              <Badge variant="outline" className="bg-white/90 text-gray-700">
                Private
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post?.project?.user?.avatar ?? ''} />
              <AvatarFallback className="text-xs">
                {post?.project?.user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link 
                href={`/profile/${post?.project?.user?.username}`}
                className="font-medium text-sm hover:underline"
              >
                @{post?.project?.user?.username}
              </Link>
              <p className="text-xs text-muted-foreground">
                {new Date(post?.createdAt ?? Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {post?.title && (
            <h3 className="font-semibold text-lg mb-2">
              {post.title}
            </h3>
          )}
          {post?.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {post.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              {isPublic && !session?.user?.id ? (
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {likeCount}
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {commentCount}
                  </div>
                  <Link href="/auth/signin">
                    <Button variant="outline" size="sm" className="h-8">
                      Sign in to interact
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={!session?.user?.id || isLiking}
                    className={`h-8 px-2 ${isLiked ? 'text-red-600 hover:text-red-700' : 'hover:text-red-600'}`}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                    {likeCount}
                  </Button>
                  
                  {isPostView ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 hover:text-blue-600"
                      onClick={() => {
                        if (!session?.user?.id && isPublic) {
                          toast.error('Please sign in to view comments')
                          router.push('/auth/signin')
                          return
                        }
                        setShowComments(!showComments)
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {commentCount}
                    </Button>
                  ) : (
                    <Link href={`/projects/${post?.project?.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-blue-600">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {commentCount}
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isOwner && !isPublic && (
                <Link href={`/projects/${post?.project?.id}/edit-post/${post?.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-blue-600">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 px-2 hover:text-green-600"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>

        {/* Comments Section - only show in post view */}
        {isPostView && showComments && (
          <div className="border-t bg-muted/10">
            <div className="p-4 space-y-4">
              {session?.user?.id ? (
                <div className="flex space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={""} />
                    <AvatarFallback className="text-xs">
                      {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex space-x-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleComment()
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleComment}
                      disabled={!newComment.trim() || isCommenting}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign in to join the conversation
                  </p>
                  <Link href="/auth/signin">
                    <Button size="sm">Sign In</Button>
                  </Link>
                </div>
              )}
              
              <Separator />
              
              {loadingComments ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.user.avatar ?? ''} />
                        <AvatarFallback className="text-xs">
                          {comment.user.username?.charAt(0)?.toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Link
                            href={`/profile/${comment.user.username}`}
                            className="font-medium text-xs hover:underline"
                          >
                            @{comment.user.username}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

