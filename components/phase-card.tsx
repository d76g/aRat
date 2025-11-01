
'use client'

import { ProjectPhase } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PHASE_LABELS } from '@/lib/types'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Edit3, Calendar } from 'lucide-react'
import { ReadMore } from '@/components/ui/read-more'

interface PhaseCardProps {
  phase: ProjectPhase
  phaseType: 'material' | 'process' | 'masterpiece'
  isOwner?: boolean
  onAddContent?: () => void
  isCompleted?: boolean
  projectTitle?: string
}

export function PhaseCard({ 
  phase, 
  phaseType, 
  isOwner = false, 
  onAddContent,
  isCompleted = false,
  projectTitle
}: PhaseCardProps) {
  const hasContent = phase && (phase?.images?.length > 0 || phase?.description || phase?.title)

  return (
    <Card className={`h-full transition-all duration-300 hover:shadow-lg ${isCompleted ? 'ring-1 ring-green-400 bg-green-50/30' : 'shadow-md'}`}>
      <CardContent className="p-4 space-y-3">
        {/* Post Images */}
        {phase?.images && phase.images.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {phase.images.slice(0, 1).map((image, index) => (
              <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={`${phaseType} phase image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Project name overlay on top left */}
                {projectTitle && (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md">
                    <p className="text-xs font-medium line-clamp-1 max-w-[160px]">
                      {projectTitle}
                    </p>
                  </div>
                )}
                {phase.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    +{phase.images.length - 1} more
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Post Title */}
        {phase?.title && (
          <h4 className="font-semibold text-sm line-clamp-2">{phase.title}</h4>
        )}
        
        {/* Post Description */}
        {phase?.description && (
          <ReadMore text={phase.description} className="text-sm" />
        )}

        {/* Post Meta */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(phase?.createdAt ?? Date.now()).toLocaleDateString()}
          </div>
          
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddContent}
              className="text-xs h-7 px-2"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>

        {/* Empty State - This shouldn't show now since we always have a phase object */}
        {!hasContent && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Empty post
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
