import { NextRequest, NextResponse } from 'next/server'
import { ScoutService } from '@/lib/services/scout-service'

export async function POST(req: NextRequest) {
  try {
    const scout = new ScoutService()
    const winners = await scout.performSurgicalScout(5) // Scan top 5 pages
    
    return NextResponse.json({ 
      success: true, 
      count: winners.length,
      products: winners 
    })
  } catch (error) {
    console.error('[Scout API] Error:', error)
    return NextResponse.json({ error: 'Failed to perform surgical scout' }, { status: 500 })
  }
}
