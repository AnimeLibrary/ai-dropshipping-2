import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'
import { StockService } from '@/lib/services/stock-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const stockService = new StockService()

export async function POST(req: Request) {
  try {
    const { productId } = await req.json()
    
    // 1. Fetch real product from DB
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { suppliers: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.stripePriceId) {
       return NextResponse.json({ error: 'Product not synced to Stripe' }, { status: 400 })
    }

    // 2. LIVE STOCK CHECK
    const cheapestSupplier = product.suppliers.find(s => s.isCheapest) || product.suppliers[0]
    if (cheapestSupplier) {
      const stock = await stockService.checkStock(cheapestSupplier.url)
      if (!stock.inStock) {
        return NextResponse.json({ 
          error: 'Product is currently out of stock at the supplier. Please check back soon.',
          stockSource: stock.source 
        }, { status: 409 })
      }
    }

    // 3. MARGIN PROTECTION (20% Floor)
    const price = Number(product.price)
    const cost = Number(product.supplierPrice || 0)
    const margin = (price - cost) / price

    if (margin < 0.20) {
      console.error(`[Checkout] 🛑 Margin protection triggered: ${product.title} (${(margin * 100).toFixed(1)}%)`)
      return NextResponse.json({ 
        error: 'Price inconsistency detected. Our team is updating this product. Please try again later.' 
      }, { status: 422 })
    }

    // 4. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/products/${product.slug}`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
      metadata: {
        internal_product_id: product.id,
        supplier_url: cheapestSupplier?.url || ''
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
