import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
})

export interface StripeSyncResult {
  success: boolean
  productId?: string
  priceId?: string
  error?: string
}

/**
 * STRIPE SYNC SERVICE
 * Automates the creation of products and prices in your Stripe account.
 */
export class StripeService {
  /**
   * Syncs a local product to Stripe.
   * Ensures the customer has a valid checkout link once the product is published.
   */
  async syncProduct(product: { id: string; title: string; price: number; heroImage?: string }): Promise<StripeSyncResult> {
    console.log(`[Stripe Sync] Syncing ${product.title}...`)

    try {
      // 1. Search for existing product by metadata ID
      const existing = await stripe.products.search({
        query: `metadata['internal_id']:'${product.id}'`,
      })

      let stripeProduct: Stripe.Product

      if (existing.data.length > 0) {
        stripeProduct = existing.data[0]
        console.log(`[Stripe Sync] Found existing product: ${stripeProduct.id}`)
      } else {
        // 2. Create New Product
        stripeProduct = await stripe.products.create({
          name: product.title,
          images: product.heroImage ? [product.heroImage] : [],
          metadata: {
            internal_id: product.id,
            origin: 'TrendDrop-AutoSync'
          }
        })
        console.log(`[Stripe Sync] Created new product: ${stripeProduct.id}`)
      }

      // 3. Create Price (Stripe prices are immutable, so we search first or create new)
      const prices = await stripe.prices.list({ product: stripeProduct.id, active: true })
      const priceAmount = Math.round(product.price * 100) // Stripe uses cents
      
      let stripePrice = prices.data.find(p => p.unit_amount === priceAmount)

      if (!stripePrice) {
        stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: priceAmount,
          currency: 'usd',
        })
        console.log(`[Stripe Sync] Created new price: ${stripePrice.id}`)
      }

      return {
        success: true,
        productId: stripeProduct.id,
        priceId: stripePrice.id
      }
    } catch (e: any) {
      console.error('[Stripe Sync] Failed:', e.message)
      return { success: false, error: e.message }
    }
  }
}
