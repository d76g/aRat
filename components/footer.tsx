'use client'

import Image from 'next/image'
import { MapPin, Mail } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export function Footer() {
  return (
    <footer className="bg-[#324426] text-[#f6f8d8] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo Section */}
          <div className="space-y-4">
            <div className="relative w-40 h-16 mb-2">
              <Image
                src="/prieelo-logo.png"
                alt="Prieelo Logo"
                fill
                className="object-contain brightness-0 invert"
                loading="lazy"
              />
            </div>
            <p className="text-sm text-[#a1c0e5] font-medium">by ARaT.eco B.V.</p>
            <p className="text-[#f6f8d8]/90 text-sm leading-relaxed">
              &quot;Scrap to Snap&quot; - Giving remakers a podium against greenwashing through complete transparency.
            </p>
          </div>

          {/* Company Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-[#a1c0e5]">Company Info</h4>
            <div className="space-y-2 text-sm text-[#f6f8d8]/90">
              <p>ARaT.eco B.V.</p>
              <p>KVK-nummer: 96388056</p>
              <p>Vestigingsnummer: 000061718092</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Netherlands</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-[#a1c0e5]">Contact</h4>
            <div className="space-y-2 text-sm text-[#f6f8d8]/90">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a 
                  href="mailto:info@arat.eco" 
                  className="hover:text-[#f6f8d8] transition-colors"
                >
                  info@arat.eco
                </a>
              </div>
            </div>
          </div>

          {/* Campaign */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-[#a1c0e5]">Campaign</h4>
            <div className="space-y-2 text-sm text-[#f6f8d8]/90">
              <p>Launch: November 3, 2025</p>
              <p>Platform: voordekunst.nl</p>
              <p>Fulfillment: December 2025</p>
              <Badge 
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-[#ed4924] hover:bg-[#ed4924]/90 text-[#f6f8d8] border-0"
              >
                Live Campaign
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="bg-[#f6f8d8]/20 mb-8" />

        <div className="text-center space-y-4">
          <p className="text-[#f6f8d8]/80 text-sm">
            © 2025 ARaT.eco B.V. All rights reserved. Made with ♻️ for a sustainable future.
          </p>
          <div className="flex justify-center space-x-4 text-xs text-[#a1c0e5]">
            <span>Raw → Remake → Reveal</span>
            <span>•</span>
            <span>Fighting Greenwashing</span>
            <span>•</span>
            <span>Christmas 2025</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

