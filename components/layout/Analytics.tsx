'use client'

import React, { useEffect, useRef } from 'react'
import Script from 'next/script'

// GA4 + Meta Pixel injected at layout level — present on every page from day 1
// Replace GA_MEASUREMENT_ID and META_PIXEL_ID with real values
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '000000000000000'

export default function Analytics() {
  const scrolledHalf = useRef(false)
  const scrolledBottom = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.body.scrollHeight
      const winHeight = window.innerHeight

      if (!scrolledHalf.current && (scrollY + winHeight) >= (docHeight * 0.5)) {
        trackEvent('scroll_depth', { depth: '50%' })
        scrolledHalf.current = true
      }

      if (!scrolledBottom.current && (scrollY + winHeight) >= (docHeight * 0.9)) {
        trackEvent('scroll_depth', { depth: '90%' })
        scrolledBottom.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: true,
          });
        `}
      </Script>

      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  )
}

// Utility: fire custom events from anywhere in the app, with built-in UTM injection
export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return

  // Auto-inject Ads / UTM context from session storage
  const payload = {
    ...params,
    utm_source: sessionStorage.getItem('utm_source') || undefined,
    utm_medium: sessionStorage.getItem('utm_medium') || undefined,
    utm_campaign: sessionStorage.getItem('utm_campaign') || undefined,
    ad_id: sessionStorage.getItem('ad_id') || undefined,
    hook: sessionStorage.getItem('hook') || undefined,
  }

  // GA4
  if ((window as any).gtag) {
    ;(window as any).gtag('event', event, payload)
  }
  // Meta Pixel
  if ((window as any).fbq) {
    ;(window as any).fbq('track', event, payload)
  }
}

