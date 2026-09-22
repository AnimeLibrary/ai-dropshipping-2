import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cluster = await prisma.keywordCluster.findUnique({
    where: { targetSlug: slug },
    select: { keyword: true, searchVolume: true, niche: true }
  })

  const title = cluster?.keyword
    ? cluster.keyword.replace(/\b\w/g, l => l.toUpperCase())
    : 'Vexsen Curated Guide'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'linear-gradient(135deg, #090714 0%, #150f28 50%, #08070d 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(0, 0, 0, 0) 70%)',
          }}
        />

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 24,
              }}
            >
              V
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.05em' }}>VEXSEN®</div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 30,
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <span>Verified Expert Guide</span>
          </div>
        </div>

        {/* Main Title Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, zIndex: 10 }}>
          <div style={{ fontSize: 20, color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Problem-Solution Breakdown
          </div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#fdf0e6',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom Proof Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 30,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 18, fontWeight: 700 }}>
              <span>★★★★★</span>
              <span style={{ color: '#ffffff', marginLeft: 4 }}>4.9/5 Rating</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 18 }}>•</div>
            <div style={{ color: '#22c55e', fontSize: 18, fontWeight: 700 }}>
              ✓ 30-Day Risk-Free Guarantee
            </div>
            <div style={{ color: '#94a3b8', fontSize: 18 }}>•</div>
            <div style={{ color: '#38bdf8', fontSize: 18, fontWeight: 700 }}>
              Insured Tracked Delivery
            </div>
          </div>

          <div style={{ color: '#64748b', fontSize: 16, fontFamily: 'monospace' }}>
            vexsen.com/guides
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
