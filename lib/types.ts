
// Prieelo Platform Types - Social Media for DIY Transformations

export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  bio?: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  title: string
  description?: string | null
  isPublic: boolean
  currentPhase: 'material' | 'process' | 'masterpiece'
  userId: string
  createdAt: Date
  updatedAt: Date
  user: User
  phases: ProjectPhase[]
  comments: Comment[]
  likes: Like[]
  _count?: {
    likes: number
    comments: number
  }
}

export interface ProjectPhase {
  id: string
  phaseType: 'material' | 'process' | 'masterpiece'
  title?: string
  description?: string
  images: string[]
  isPublic: boolean
  projectId: string
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  content: string
  userId: string
  projectId: string
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface Like {
  id: string
  userId: string
  projectId: string
  createdAt: Date
  user: User
}

export interface CreateProjectData {
  title: string
  description?: string
  isPublic: boolean
}

export interface CreatePhaseData {
  phaseType: 'material' | 'process' | 'masterpiece'
  title?: string
  description?: string
  images: string[]
  isPublic?: boolean
}

export const PHASE_LABELS = {
  material: '📦 Raw',
  process: '🔧 Remake', 
  masterpiece: '✨ Reveal'
} as const

export const PHASE_DESCRIPTIONS = {
  material: 'Show us what you\'re starting with - the raw materials and waste items',
  process: 'Document your transformation remaking process and techniques',
  masterpiece: 'Reveal your finished creation - from scrap to snap!'
} as const
