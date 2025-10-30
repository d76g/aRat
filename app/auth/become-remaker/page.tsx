

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Recycle, Wrench, Palette, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function BecomeRemakerPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    projectDescription: '',
    experience: '',
    motivation: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/become-remaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
        toast.success('Application submitted successfully!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Something went wrong')
      }
    } catch (error) {
      toast.error('Failed to submit application')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prieelo-cream to-prieelo-blue/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Application Submitted!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for applying to become a Remaker! Our team will review your application and get back to you soon.
            </p>
            <p className="text-sm text-gray-500">
              You'll receive an email notification once your application has been reviewed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-prieelo-cream to-prieelo-blue/20 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative aspect-square w-11 h-11 mr-3">
              <Image
                src="/ideas-05.png"
                alt="Prieelo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Prieelo</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Become a Remaker
          </h2>
          <p className="text-lg text-gray-600">
            Join our exclusive community of creative transformers
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Information */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-indigo-600" />
                  What is a Remaker?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Remakers are creative individuals who transform the ordinary into extraordinary through:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Recycle className="h-5 w-5 text-green-500" />
                    <span><strong>Re-cycling:</strong> Giving new life to discarded materials</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-blue-500" />
                    <span><strong>Re-purposing:</strong> Finding new uses for existing items</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-purple-500" />
                    <span><strong>Re-designing:</strong> Transforming objects with creative vision</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Prieelo?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Share your transformation projects with like-minded creators</li>
                  <li>• Get inspired by amazing DIY transformations</li>
                  <li>• Connect with a community that values sustainability</li>
                  <li>• Document your creative process from material to masterpiece</li>
                  <li>• Early access to our exclusive platform features</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>Application Form</CardTitle>
              <CardDescription>
                Tell us about your creative journey and why you'd be a great Remaker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="projectDescription">
                    Describe Your Most Proud Transformation Project
                  </Label>
                  <Textarea
                    id="projectDescription"
                    placeholder="Tell us about a project where you recycled, repurposed, or redesigned something. What did you make and how did you do it?"
                    className="min-h-[120px]"
                    value={formData.projectDescription}
                    onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="experience">
                    Your DIY/Crafting Experience
                  </Label>
                  <Textarea
                    id="experience"
                    placeholder="How long have you been doing DIY projects? What types of materials and techniques do you work with?"
                    className="min-h-[100px]"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="motivation">
                    Why Do You Want to Join Prieelo?
                  </Label>
                  <Textarea
                    id="motivation"
                    placeholder="What motivates you to create and transform? How would you contribute to our community?"
                    className="min-h-[100px]"
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-prieelo-green to-prieelo-orange hover:from-indigo-600 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting Application...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Have questions? Contact us at{' '}
            <a href="mailto:support@prieelo.com" className="text-indigo-600 hover:underline">
              support@prieelo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

