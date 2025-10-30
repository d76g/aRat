
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Star, Gift, Users, Recycle, Eye, ArrowRight, Heart } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export function CrowdfundingLanding() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/crowdfunding/reusers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setSubmitted(true)
        setEmail('')
      }
    } catch (error) {
      console.error('Error submitting email:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-prieelo-cream via-prieelo-blue/20 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-4 h-4">
              <Image 
                src="/images/prieelo-logo.png" 
                alt="Prieelo Logo" 
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-prieelo-green">Prieelo</h1>
              <p className="text-xs text-gray-600">by ARaT.eco B.V.</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-prieelo-orange/20 text-prieelo-orange animate-pulse">
            🎄 Christmas Campaign Live
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-4 bg-prieelo-green hover:bg-prieelo-green/90">
            🚀 Pre-Launch • Launching by Christmas 2025
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-prieelo-green mb-6 leading-tight">
            Give <span className="text-prieelo-green">Remakers</span> a Podium
            <br />
            Against <span className="text-prieelo-orange">Greenwashing</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            The first social platform where creative upcycling gets the transparency it deserves. 
            Every project tells its complete story: <strong>Raw → Remaking → Reveal</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button 
              size="lg" 
              className="bg-prieelo-green hover:bg-prieelo-green/90 text-white px-8 py-4 text-lg"
              onClick={() => document.getElementById('remaker-signup')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Star className="mr-2 h-5 w-5" />
              Join as Remaker
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-prieelo-green text-prieelo-green hover:bg-prieelo-cream px-8 py-4 text-lg"
              onClick={() => document.getElementById('reuser-signup')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Gift className="mr-2 h-5 w-5" />
              Get Christmas Upcycles
            </Button>
          </div>
        </motion.div>
      </section>

      {/* The Problem & Solution */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-prieelo-green mb-6">
              The Problem with Today's "Green" Market
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              Genuine remakers who pour their creativity into transforming waste face unfair competition from 
              companies that simply slap "eco-friendly" labels on mass-produced items. <strong>Greenwashing is killing authentic sustainability.</strong>
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-prieelo-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Recycle className="h-8 w-8 text-prieelo-orange" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-prieelo-orange">Raw Materials</h3>
              <p className="text-gray-700">Every project starts with waste, scraps, or discarded items ready for transformation.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-prieelo-blue/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-prieelo-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-prieelo-blue">Remaking Process</h3>
              <p className="text-gray-700">Document the creative journey - tools, techniques, challenges, and breakthroughs.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-prieelo-green" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-prieelo-green">Reveal Results</h3>
              <p className="text-gray-700">Showcase the final creation with its complete traceable story for buyers.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Christmas Campaign */}
      <section className="bg-gradient-to-r from-prieelo-orange/10 to-prieelo-cream py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-prieelo-green mb-6 flex items-center justify-center gap-3">
              <Gift className="h-8 w-8 text-prieelo-orange" />
              Christmas Upcycle Campaign
              <Gift className="h-8 w-8 text-prieelo-green" />
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-8">
              Join our Christmas campaign! We're collecting talented remakers to create exclusive Christmas upcycles 
              for our crowdfunding backers. Every piece comes with its complete <strong>Raw → Remaking → Reveal</strong> story, 
              making each gift truly meaningful and traceable.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Star className="h-5 w-5" />
                    For Remakers
                  </CardTitle>
                  <CardDescription>
                    Join our platform and create Christmas magic from waste
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-prieelo-green" />
                      <span>Get paid for your Christmas upcycles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-prieelo-green" />
                      <span>Build your maker profile</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-prieelo-green" />
                      <span>Exclusive platform early access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-prieelo-green" />
                      <span>Join the anti-greenwashing movement</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Heart className="h-5 w-5" />
                    For Reusers (Buyers)
                  </CardTitle>
                  <CardDescription>
                    Get meaningful Christmas gifts with complete stories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-prieelo-blue" />
                      <span>Exclusive Christmas upcycles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-prieelo-blue" />
                      <span>Complete traceable stories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-prieelo-blue" />
                      <span>Support authentic sustainability</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-prieelo-blue" />
                      <span>Early access to platform</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Signup Sections */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Remaker Signup */}
            <motion.div 
              id="remaker-signup"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-2xl text-green-700 flex items-center gap-2">
                    <Star className="h-6 w-6" />
                    Join as a Remaker
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Ready to showcase your creative upcycling skills and earn from your Christmas creations?
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4 mb-6">
                    <p className="text-gray-700">
                      Complete our detailed form to join our exclusive remaker community:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Tell us about your upcycling experience</li>
                      <li>• Share your creative process and tools</li>
                      <li>• Upload examples of your work</li>
                      <li>• Set your availability for Christmas projects</li>
                    </ul>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-prieelo-green hover:bg-prieelo-green/90 text-white"
                    onClick={() => window.open('https://app.formbricks.com/s/hfcyr586pefyb695tmhmj88m', '_blank')}
                  >
                    Complete Remaker Application
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Takes 5-10 minutes • Exclusive opportunity
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Reuser Signup */}
            <motion.div 
              id="reuser-signup"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-2xl text-blue-700 flex items-center gap-2">
                    <Gift className="h-6 w-6" />
                    Get Christmas Upcycles
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Be the first to access meaningful, traceable Christmas gifts with complete stories.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {submitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-prieelo-green mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-green-700 mb-2">Thank you!</h3>
                      <p className="text-gray-700">
                        You'll be the first to know when our Christmas upcycles are available.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        <p className="text-gray-700">
                          Join our exclusive list to get first access to Christmas upcycles from our talented remakers.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• First access to Christmas collection</li>
                          <li>• Exclusive updates on campaign progress</li>
                          <li>• Stories behind each unique piece</li>
                          <li>• Early platform access when we launch</li>
                        </ul>
                      </div>
                      
                      <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="text-lg py-3"
                        />
                        <Button 
                          type="submit"
                          size="lg" 
                          disabled={isSubmitting}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isSubmitting ? 'Joining...' : 'Join the List'}
                          <Gift className="ml-2 h-5 w-5" />
                        </Button>
                      </form>
                      
                      <p className="text-xs text-gray-500 mt-4 text-center">
                        No spam, just exclusive Christmas upcycle updates
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-prieelo-green text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="relative w-5 h-5">
                <Image 
                  src="/images/prieelo-logo.png" 
                  alt="Prieelo Logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold">Prieelo</h3>
                <p className="text-sm text-gray-400">Empowering authentic sustainability</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                Operated by ARaT.eco B.V.
              </p>
              <p className="text-xs text-gray-500">
                KVK-nummer: 96388056 • Vestigingsnummer: 000061718092
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Contact: <a href="mailto:info@arat.eco" className="text-blue-400 hover:text-blue-300">info@arat.eco</a>
              </p>
            </div>
          </div>
          
          <Separator className="my-8 bg-gray-700" />
          
          <div className="text-center text-sm text-gray-400">
            <p>&copy; 2024 ARaT.eco B.V. All rights reserved. • Fighting greenwashing, one traceable story at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
