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
          background: 'linear-gradient(135deg, #181824 0%, #0b0b10 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 512 512" fill="none">
          <path
            d="M120 130 L220 130 L256 260 L292 130 L392 130 L296 382 C280 422 232 422 216 382 Z"
            fill="url(#appleVexGrad)"
          />
          <path d="M256 310 L280 180 L232 180 Z" fill="#0b0b10" opacity="0.9" />
          <defs>
            <linearGradient id="appleVexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
