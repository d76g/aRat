'use client'

import Image from 'next/image'
import { MapPin, Mail } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Footer() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isFullWidthPage = pathname?.startsWith('/admin')
  
  return (
    <footer 
      className={cn(
        "bg-background border-t text-[#324426] py-16 px-6 sm:px-8 w-full mt-auto"
      )}
    >
      <div
        className={cn(
          isFullWidthPage ? "w-full" : "max-w-6xl mx-auto"
        )}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Logo Section */}
          <div className="space-y-4">
            <div className="relative w-40 h-16 mb-2">
              <Image
                src="/prieelo-logo.png"
                alt="Prieelo Logo"
                fill
                className="object-contain"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(18%) sepia(10%) saturate(1021%) hue-rotate(67deg) brightness(94%) contrast(86%)'
                }}
                loading="lazy"
              />
            </div>
            <p className="text-sm text-[#a1c0e5] font-medium">by ARaT.eco B.V.</p>
            <p className="text-sm leading-relaxed text-[#324426]/80">
              &quot;Scrap to Snap&quot; - Giving remakers a podium against greenwashing through complete transparency.
            </p>
          </div>

          {/* Company Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-[#a1c0e5]">Company Info</h4>
            <div className="space-y-2 text-sm text-[#324426]">
              <p>ARaT.eco B.V.</p>
              <p>KVK-nummer: 96388056</p>
              <p>Vestigingsnummer: 000061718092</p>
              <div className="flex items-center gap-2 text-[#324426]">
                <MapPin className="w-4 h-4" />
                <span>Netherlands</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-[#a1c0e5]">Contact</h4>
            <div className="space-y-2 text-sm text-[#324426]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a 
                  href="mailto:info@arat.eco" 
                  className="hover:text-[#a1c0e5] transition-colors"
                >
                  info@arat.eco
                </a>
              </div>
            </div>
          </div>

          {/* Campaign Banner - temporarily disabled */}
        {/*
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-[#a1c0e5]">Campaign</h4>
            <div className="space-y-2 text-sm text-[#324426]">
              <p>Launch: November 3, 2025</p>
              <p>Platform: voordekunst.nl</p>
              <p>Fulfillment: December 2025</p>
              <a 
                href="https://www.voordekunst.nl/projecten/20029-prieelo-a-platform-turning-scrap-to-snap"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Badge 
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-[#ed4924] hover:bg-[#ed4924]/90 text-[#f6f8d8] border-0 cursor-pointer"
                >
                  Live Campaign
                </Badge>
              </a>
            </div>
          </div>
          */}
        </div>
        

        <Separator className="bg-[#324426]/20 mb-8" />

        <div className="text-center space-y-4">
          <p className="text-[#324426]/80 text-sm">
            © 2026 ARaT.eco B.V. All rights reserved. Made with ♻️ for a sustainable future.
          </p>
          <div className="flex justify-center space-x-4 text-xs text-[#a1c0e5]">
            <span>Raw → Remake → Reveal</span>
            <span>•</span>
            <span>Fighting Greenwashing</span>
            <span>•</span>
            <span>Sustainable Future</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

