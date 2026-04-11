import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/reviews?slug=product-slug — fetch approved reviews
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const reviews = await prisma.review.findMany({
    where: { productSlug: slug, status: 'approved' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, rating: true, title: true, body: true, authorName: true, verified: true, createdAt: true }
  })

  return NextResponse.json({ reviews })
}

// POST /api/reviews — submit a new review
export async function POST(req: NextRequest) {
  try {
    const { productSlug, rating, title, body, authorName, authorEmail } = await req.json()

    if (!productSlug || !rating || !body || !authorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }
    if (body.length < 10) {
      return NextResponse.json({ error: 'Review must be at least 10 characters' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { slug: productSlug } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    await prisma.review.create({
      data: {
        productId: product.id,
        productSlug,
        rating: Number(rating),
        title: title?.slice(0, 100) || null,
        body: body.slice(0, 2000),
        authorName: authorName.slice(0, 80),
        authorEmail: authorEmail || null,
        status: 'pending', // requires admin approval before showing publicly
      }
    })

    return NextResponse.json({ success: true, message: 'Review submitted! It will appear after moderation.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
