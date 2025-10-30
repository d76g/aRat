

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { PHASE_LABELS } from '@/lib/types'
import Image from 'next/image'

interface EditPostPageProps {
  params: { id: string; postId: string }
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as string[],
    isPublic: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [post, setPost] = useState<any>(null)
  
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (params?.postId) {
      fetchPost()
    }
  }, [params?.postId])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/projects/phases/${params.postId}`)
      if (response?.ok) {
        const data = await response.json()
        const postData = data?.post
        setPost(postData)
        setFormData({
          title: postData?.title || '',
          description: postData?.description || '',
          images: postData?.images || [],
          isPublic: postData?.isPublic !== false
        })
      } else {
        setError('Failed to load post')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      setError('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">You need to be signed in to edit posts</p>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Post not found</p>
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
      const uploadPromises = Array.from(files).map(async (file) => {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        })
        
        if (!response?.ok) {
          throw new Error('Failed to upload image')
        }
        
        const data = await response.json()
        return data?.url
      })

      const imageUrls = await Promise.all(uploadPromises)
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls.filter(Boolean)]
      }))
      
      toast.success(`${imageUrls.length} image(s) uploaded successfully!`)
    } catch (error) {
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/projects/phases/${params.postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response?.ok) {
        toast.success('Post updated successfully!')
        router.refresh() // Force refresh to show changes
        router.push(`/projects/${params.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData?.message || 'Failed to update post')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/phases/${params.postId}`, {
        method: 'DELETE'
      })

      if (response?.ok) {
        toast.success('Post deleted successfully!')
        router.refresh() // Force refresh to show changes
        router.push(`/projects/${params.id}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData?.message || 'Failed to delete post')
      }
    } catch (error) {
      toast.error('Something went wrong')
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
            <h1 className="text-2xl font-bold">Edit {PHASE_LABELS[post?.phaseType as keyof typeof PHASE_LABELS] || 'Post'}</h1>
            <p className="text-muted-foreground">Update your post details and privacy settings</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Post</CardTitle>
            <CardDescription>
              Update photos, text, and privacy settings for your post
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
                        <span className="font-semibold">Click to upload</span> more photos
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 15MB each)</p>
                    </div>
                    <input
                      id="images"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading || saving}
                    />
                  </label>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                          disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
                />
              </div>
            </CardContent>

            <div className="flex justify-between p-6 pt-0">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                Delete Post
              </Button>
              
              <div className="flex space-x-4">
                <Link href={`/projects/${params.id}`}>
                  <Button variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={saving || uploading}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

