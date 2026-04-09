import { NextRequest, NextResponse } from 'next/server'
import { products, ValidationStatus, fetchProductImageFromInternet } from '@/lib/data/products'

// ============================================================
// POST /api/admin/products/[id]/status
// Body: { action: 'approve' | 'queue' | 'reject', notes?: string }
//
// State machine:
//   pending  → approve  → approved
//   approved → queue    → queuedForPublish
//   *        → reject   → rejected
//
// In production: replace in-memory mutation with DB write (Supabase/PlanetScale).
// ============================================================

type Action = 'approve' | 'queue' | 'reject'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await req.json() as { action: Action; notes?: string }
  const { action, notes } = body

  const product = products.find((p) => p.id === id)

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const validTransitions: Record<Action, ValidationStatus> = {
    approve: 'approved',
    queue: 'queuedForPublish',
    reject: 'rejected',
  }

  const nextStatus = validTransitions[action]
  if (!nextStatus) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Guard: can only queue something that's already approved
  if (action === 'queue' && product.validationStatus !== 'approved') {
    return NextResponse.json(
      { error: 'Product must be approved before queuing for publish' },
      { status: 400 }
    )
  }

  // Apply the state transition (in-memory — replace with DB write in production)
  product.validationStatus = nextStatus
  if (notes) product.validationNotes = notes
  
  if (action === 'approve') {
    product.validatedAt = new Date().toISOString()
    product.validatedBy = 'admin'
    
    // ============================================================
    // AI IMAGE FETCHING LAYER
    // Automatically pull real product images from the internet
    // after admin approval.
    // ============================================================
    product.heroImage = await fetchProductImageFromInternet(product)
    console.log(`[AI] Product image updated for ${product.id}: ${product.heroImage}`)
  } else if (action === 'queue') {
    product.validatedAt = new Date().toISOString()
    product.validatedBy = 'admin'
  }

  return NextResponse.json({
    success: true,
    product: {
      id: product.id,
      title: product.title,
      validationStatus: product.validationStatus,
      validatedAt: product.validatedAt,
      heroImage: product.heroImage,
    },
  })
}
