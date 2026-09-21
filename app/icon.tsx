import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #181824 0%, #0b0b10 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontWeight: 900,
          color: '#ec4899',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 512 512" fill="none">
          <path
            d="M120 130 L220 130 L256 260 L292 130 L392 130 L296 382 C280 422 232 422 216 382 Z"
            fill="url(#iconVexGrad)"
          />
          <path d="M256 310 L280 180 L232 180 Z" fill="#0b0b10" opacity="0.9" />
          <defs>
            <linearGradient id="iconVexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
