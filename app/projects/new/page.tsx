
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { data: session } = useSession()
  const router = useRouter()

  if (!session?.user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">You need to be signed in to create projects</p>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response?.ok) {
        const data = await response.json()
        toast.success('Project created! Start adding your transformation phases.')
        router.push(`/projects/${data?.project?.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData?.message || 'Failed to create project')
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
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create New Project</h1>
            <p className="text-muted-foreground">Start your transformation journey</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Give your project a name and description. You'll add photos and content for each phase next.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Plastic Bottle Planters, Tire Ottoman, etc."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What are you transforming? What inspired this project?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isPublic">Make Project Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Public projects appear in the community feed and can be liked/commented on
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                  disabled={loading}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Next Steps:</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. 📦 <strong>Raw Phase:</strong> Show your starting materials and waste items</li>
                  <li>2. 🔧 <strong>Remaking Phase:</strong> Document your transformation techniques</li>
                  <li>3. ✨ <strong>Reveal Phase:</strong> Reveal your finished creation</li>
                </ol>
              </div>
            </CardContent>

            <div className="flex justify-end space-x-4 p-6 pt-0">
              <Link href="/">
                <Button variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !formData.title.trim()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
