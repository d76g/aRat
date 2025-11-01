
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PHASE_LABELS, PHASE_DESCRIPTIONS } from '@/lib/types'
import Image from 'next/image'
import { resizeImageTo4x3 } from '@/lib/image-utils'

interface AddPostPageProps {
  params: { id: string }
}

export default function AddPostPage({ params }: AddPostPageProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as string[], // S3 keys for database storage
    previewUrls: [] as string[], // Signed URLs for preview
    isPublic: true
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState(null)
  
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const phaseType = searchParams.get('phase') as 'material' | 'process' | 'masterpiece'

  useEffect(() => {
    if (params?.id) {
      fetchProject()
    }
  }, [params?.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response?.ok) {
        const data = await response.json()
        setProject(data?.project)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">You need to be signed in to add posts</p>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!phaseType || !['material', 'process', 'masterpiece'].includes(phaseType)) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Invalid phase type</p>
            <Link href={`/projects/${params.id}`}>
              <Button>Back to Project</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    
    try {
      // Process all selected files
      const uploadPromises = Array.from(files).map(async (file) => {
        // Check file size (15MB limit)
        if (file.size > 15 * 1024 * 1024) {
          throw new Error('File too large. Maximum size is 15MB')
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select an image file')
        }

        // Resize and crop to 4:3 aspect ratio
        let processedFile: File | Blob
        try {
          const resizedBlob = await resizeImageTo4x3(file)
          // Create a File object from the blob
          processedFile = new File([resizedBlob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
        } catch (resizeError) {
          console.error('Error resizing image:', resizeError)
          toast.error('Failed to process image. Using original.')
          processedFile = file // Fallback to original
        }

        const formData = new FormData()
        formData.append('file', processedFile)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!response?.ok) {
          throw new Error('Failed to upload image')
        }
        
        const data = await response.json()
        return {
          cloudStoragePath: data?.cloud_storage_path,
          url: data?.url
        }
      })

      const results = await Promise.all(uploadPromises)
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...results.map(r => r.cloudStoragePath)],
        previewUrls: [...prev.previewUrls, ...results.map(r => r.url)]
      }))
      
      toast.success(`${results.length} image(s) uploaded and processed to 4:3 ratio!`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      // Reset file input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      previewUrls: prev.previewUrls.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          phaseType,
          title: formData.title,
          description: formData.description,
          images: formData.images,
          isPublic: formData.isPublic
        })
      })

      if (response?.ok) {
        toast.success('Post added successfully!')
        router.push(`/projects/${params.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData?.message || 'Failed to add post')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href={`/projects/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Add {PHASE_LABELS[phaseType]} Post</h1>
            <p className="text-muted-foreground">{PHASE_DESCRIPTIONS[phaseType]}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New {PHASE_LABELS[phaseType]} Post</CardTitle>
            <CardDescription>
              Add photos and details for this phase of your project
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Image Upload */}
              <div className="space-y-4">
                <Label htmlFor="images">Photos</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> photos
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 15MB each)</p>
                    </div>
                    <input
                      id="images"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {/* Image Preview */}
                {formData.previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.previewUrls.map((previewUrl, index) => (
                      <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        <Image
                          src={previewUrl}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Post Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Give this post a descriptive title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about this part of your transformation..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isPublic">Make Post Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Public posts appear in feeds and can be liked/commented on by everyone
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                  disabled={loading}
                />
              </div>
            </CardContent>

            <div className="flex justify-end space-x-4 p-6 pt-0">
              <Link href={`/projects/${params.id}`}>
                <Button variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={loading || uploading || (formData.images.length === 0 && !formData.title && !formData.description)}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Post
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
