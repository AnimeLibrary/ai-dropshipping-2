import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'radial-gradient(circle at 50% 30%, #1e1838 0%, #07060a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          border: '3px solid rgba(168, 85, 247, 0.4)',
        }}
      >
        <svg width="130" height="130" viewBox="0 0 512 512" fill="none">
          <defs>
            <linearGradient id="appleLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="appleRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="appleCore" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M108 128 L196 128 L256 312 L208 340 L108 128 Z" fill="url(#appleLeft)" />
          <path d="M404 128 L316 128 L256 312 L304 340 L404 128 Z" fill="url(#appleRight)" />
          <path d="M256 168 L286 244 L256 394 L226 244 Z" fill="url(#appleCore)" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
