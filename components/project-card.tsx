
'use client'

import { useState } from 'react'
import { Project } from '@/lib/types'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Share2, User } from 'lucide-react'
import Link from 'next/link'
import { LocalImage } from '@/components/local-image'
import { motion } from 'framer-motion'
import { PHASE_LABELS } from '@/lib/types'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface ProjectCardProps {
  project: Project
  onLike?: (projectId: string, isLiked: boolean) => void
  onShare?: (projectId: string) => void
}

export function ProjectCard({ project, onLike, onShare }: ProjectCardProps) {
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(
    project?.likes?.some(like => like?.userId === session?.user?.id) ?? false
  )
  const [likeCount, setLikeCount] = useState(project?._count?.likes ?? 0)
  const [isLiking, setIsLiking] = useState(false)

  const currentPhase = project?.phases?.find(phase => phase?.phaseType === project?.currentPhase)
  const mainImage = currentPhase?.images?.[0] ?? project?.phases?.[0]?.images?.[0]

  const handleLike = async () => {
    if (!session?.user?.id || isLiking) return
    
    setIsLiking(true)
    try {
      const response = await fetch('/api/projects/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project?.id })
      })

      if (response?.ok) {
        const newIsLiked = !isLiked
        setIsLiked(newIsLiked)
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
        onLike?.(project?.id, newIsLiked)
      } else {
        toast.error('Failed to like project')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator?.share) {
        await navigator.share({
          title: project?.title ?? 'Check out this project',
          text: project?.description ?? 'Amazing transformation on Prieelo!',
          url: `${window?.location?.origin}/projects/${project?.id}`
        })
      } else {
        await navigator?.clipboard?.writeText(`${window?.location?.origin}/projects/${project?.id}`)
        toast.success('Link copied to clipboard!')
      }
      onShare?.(project?.id)
    } catch (error) {
      // User cancelled sharing or clipboard failed
    }
  }

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
            <div className="relative aspect-[4/3] bg-muted">
              <LocalImage
                src={mainImage}
                alt={project?.title ?? 'Project image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                cacheBust={new Date(project?.updatedAt ?? Date.now()).getTime()}
              />
              {/* Project name overlay on top left */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md">
                <p className="text-sm font-medium line-clamp-1 max-w-[200px]">
                  {project?.title}
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] bg-muted flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute top-3 right-3">
            <Badge variant={
              project?.currentPhase === 'masterpiece' ? 'reveal' :
              project?.currentPhase === 'process' ? 'remake' : 'raw'
            }>
              {PHASE_LABELS[project?.currentPhase ?? 'material']}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={project?.user?.avatar ?? ''} />
              <AvatarFallback className="text-xs">
                {project?.user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link 
                href={`/profile/${project?.user?.username}`}
                className="font-medium text-sm hover:underline"
              >
                @{project?.user?.username}
              </Link>
              <p className="text-xs text-muted-foreground">
                {new Date(project?.createdAt ?? Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Link href={`/projects/${project?.id}`} className="block group">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-green-600 transition-colors">
              {project?.title}
            </h3>
            {project?.description && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                {project.description}
              </p>
            )}
          </Link>
        </CardContent>

        <CardFooter className="px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
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
              
              <Link href={`/projects/${project?.id}`}>
                <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-blue-600">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {project?._count?.comments ?? 0}
                </Button>
              </Link>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 px-2 hover:text-green-600"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
