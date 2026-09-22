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
      const { productId, priceId } = await req.json()
      
      // 1. Fetch real product from DB
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { suppliers: true, variants: true }
      })
  
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
  
      // Determine the correct Stripe Price ID and CJ Variant VID
      // Flow: If priceId is provided, find the matching variant. Fallback to default variant. Fallback to product.
      let activeStripePriceId = product.stripePriceId
      let activeCjVariantVid = product.cjVariantId
  
      if (priceId && product.variants.length > 0) {
        const variant = product.variants.find(v => v.stripeVariantPriceId === priceId)
        if (variant) {
          activeStripePriceId = variant.stripeVariantPriceId
          activeCjVariantVid = variant.vid
        }
      } else if (product.variants.length > 0) {
        // Fallback to default variant if no priceId provided
        const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0]
        if (defaultVariant) {
            activeStripePriceId = defaultVariant.stripeVariantPriceId
            activeCjVariantVid = defaultVariant.vid
        }
      }
  
      if (!activeStripePriceId) {
         return NextResponse.json({ error: 'Product not synced to Stripe properly' }, { status: 400 })
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
  
      // 4. Create Stripe Session with Auto Payment Methods (Apple Pay, Google Pay, Card) + Phone for CJ
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: activeStripePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/products/${product.slug}`,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU'],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 495, // $4.95 Standard Tracked & Insured
                currency: 'usd',
              },
              display_name: 'Standard Tracked & Insured Delivery',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 7 },
                maximum: { unit: 'business_day', value: 12 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 895, // $8.95 Priority Expedited
                currency: 'usd',
              },
              display_name: 'Priority Insured & Expedited Dispatch',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 4 },
                maximum: { unit: 'business_day', value: 8 },
              },
            },
          },
        ],
        automatic_tax: {
          enabled: false,
        },
        phone_number_collection: {
          enabled: true,
        },
        metadata: {
          internal_product_id: product.id,
          supplier_url: cheapestSupplier?.url || '',
          cj_variant_vid: activeCjVariantVid || '' // <-- Crucial for webhook fulfillment
        }
      })


    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
