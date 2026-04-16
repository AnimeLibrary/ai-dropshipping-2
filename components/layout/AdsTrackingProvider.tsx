'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface AdsContextType {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  adId: string | null
  hook: string | null
}

const AdsContext = createContext<AdsContextType>({
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  adId: null,
  hook: null,
})

export function useAdsTracking() {
  return useContext(AdsContext)
}

export default function AdsTrackingProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const [adsData, setAdsData] = useState<AdsContextType>({
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    adId: null,
    hook: null,
  })

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    // Read URL or fallback to sessionStorage
    const currentSource = searchParams.get('utm_source') || sessionStorage.getItem('utm_source')
    const currentMedium = searchParams.get('utm_medium') || sessionStorage.getItem('utm_medium')
    const currentCampaign = searchParams.get('utm_campaign') || sessionStorage.getItem('utm_campaign')
    const currentAdId = searchParams.get('ad_id') || sessionStorage.getItem('ad_id')
    const currentHook = searchParams.get('hook') || sessionStorage.getItem('hook')

    const newAdsData = {
      utmSource: currentSource,
      utmMedium: currentMedium,
      utmCampaign: currentCampaign,
      adId: currentAdId,
      hook: currentHook,
    }

    setAdsData(newAdsData)

    // Save back to session storage to persist across pages
    if (currentSource) sessionStorage.setItem('utm_source', currentSource)
    if (currentMedium) sessionStorage.setItem('utm_medium', currentMedium)
    if (currentCampaign) sessionStorage.setItem('utm_campaign', currentCampaign)
    if (currentAdId) sessionStorage.setItem('ad_id', currentAdId)
    if (currentHook) sessionStorage.setItem('hook', currentHook)

  }, [searchParams])

  return (
    <AdsContext.Provider value={adsData}>
      {children}
    </AdsContext.Provider>
  )
}
