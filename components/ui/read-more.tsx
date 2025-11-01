'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ReadMoreProps {
  text: string
  maxLength?: number
  className?: string
}

export function ReadMore({ text, maxLength = 150, className = '' }: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text) return null

  const needsTruncation = text.length > maxLength
  const displayText = isExpanded || !needsTruncation 
    ? text 
    : `${text.slice(0, maxLength)}...`

  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {displayText}
      </p>
      {needsTruncation && (
        <Button
          variant="link"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground mt-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </Button>
      )}
    </div>
  )
}

