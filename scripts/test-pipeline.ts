import { prisma } from '../lib/db/prisma'
import { cj } from '../lib/services/cj-service'
import Stripe from 'stripe'
import fs from 'fs'
import path from 'path'

// Load .env
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim()
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
        if (!process.env[key]) process.env[key] = val
      }
    }
  }
} catch {}

async function runPipelineDiagnostics() {
  console.log('=====================================================')
  console.log('  🔍 SURGICAL E-COMMERCE PIPELINE DIAGNOSTIC SUITE  ')
  console.log('=====================================================\n')

  let allPassed = true

  // 1. STRIPE CONNECTION & BALANCE
  console.log('▶ [1/4] Checking Stripe Credentials & Live API...')
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    console.error('❌ STRIPE_SECRET_KEY is missing in .env')
    allPassed = false
  } else {
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as any })
      const balance = await stripe.balance.retrieve()
      console.log(`✅ Stripe Connected! Mode: ${stripeKey.startsWith('sk_live') ? 'LIVE 🟢' : 'TEST 🟡'}`)
      console.log(`   Available Balance: $${(balance.available[0]?.amount || 0) / 100} ${balance.available[0]?.currency.toUpperCase() || 'USD'}`)
    } catch (err: any) {
      console.error('❌ Stripe API Failed:', err.message)
      allPassed = false
    }
  }

  // 2. CJ DROPSHIPPING CONNECTION & AUTH
  console.log('\n▶ [2/4] Checking CJ Dropshipping Auth & Logistics...')
  if (!cj.isConfigured()) {
    console.error('❌ CJ Dropshipping credentials missing (CJ_EMAIL or CJ_API_KEY)')
    allPassed = false
  } else {
    try {
      const token = await cj.getAccessToken()
      if (token) {
        console.log('✅ CJ Dropshipping Authenticated! Access Token active.')
      } else {
        console.error('❌ CJ Dropshipping returned empty token.')
        allPassed = false
      }
    } catch (err: any) {
      console.error('❌ CJ Dropshipping Auth Failed:', err.message)
      allPassed = false
    }
  }

  // 3. DATABASE PRODUCT & VARIANT INTEGRITY
  console.log('\n▶ [3/4] Checking Product & Variant Database Integrity...')
  let testProduct: any = null
  try {
    const products = await prisma.product.findMany({
      where: { validationStatus: 'approved' },
      include: { variants: true, suppliers: true }
    })

    if (products.length === 0) {
      console.warn('⚠️ No approved products found in database.')
    } else {
      testProduct = products[0]
      console.log(`✅ Found approved product: "${testProduct.title}" (ID: ${testProduct.id})`)
      console.log(`   Slug: /products/${testProduct.slug}`)
      console.log(`   Base Retail Price: $${Number(testProduct.price).toFixed(2)}`)
      console.log(`   Variants count: ${testProduct.variants.length}`)
      
      testProduct.variants.forEach((v: any, idx: number) => {
        console.log(`   - Variant [${idx + 1}]: "${v.label}" | Retail: $${Number(v.retailPrice).toFixed(2)} | Cost: $${Number(v.supplierPrice).toFixed(2)} | CJ VID: ${v.vid || 'N/A'}`)
      })

      if (testProduct.cjProductId) {
        console.log(`\n   Querying CJ Live Shipping calculation for PID ${testProduct.cjProductId} (US destination)...`)
        try {
          const vid = testProduct.variants[0]?.vid
          const shippingData: any = await (cj as any).request(
            '/logistic/freightCalculate',
            'POST',
            {
              startCountryCode: 'CN',
              endCountryCode: 'US',
              products: [{ vid, quantity: 1 }]
            }
          )
          const shipping = shippingData?.data || []
          if (Array.isArray(shipping) && shipping.length > 0) {
            console.log(`   ✅ Live CJ Shipping Options received (${shipping.length} carriers):`)
            shipping.slice(0, 5).forEach((opt: any) => {
              console.log(`      * ${opt.logisticName || opt.logisticCode}: $${opt.logisticPrice} (${opt.logisticAging || 'N/A'} days)`)
            })
          } else {
            console.log(`   ℹ️ CJ Shipping query response:`, JSON.stringify(shippingData))
          }
        } catch (e: any) {
          console.warn(`   ⚠️ CJ Shipping query warning:`, e.message)
        }
      }
    }
  } catch (err: any) {
    console.error('❌ Database query failed:', err.message)
    allPassed = false
  }

  // 4. CHECKOUT SESSION CREATION DRY-RUN
  console.log('\n▶ [4/4] Testing Stripe Checkout Session Generation...')
  if (testProduct && stripeKey) {
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as any })
      const variant = testProduct.variants[0] || null
      const activePrice = variant ? Number(variant.retailPrice) : Number(testProduct.price)

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${testProduct.title}${variant ? ` - ${variant.label}` : ''}`,
                description: 'Test Verification Session',
              },
              unit_amount: Math.round(activePrice * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU'],
        },
        phone_number_collection: {
          enabled: true,
        },
        success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: `http://localhost:3000/products/${testProduct.slug}`,
        metadata: {
          productId: testProduct.id,
          cj_variant_vid: variant?.vid || testProduct.cjVariantId || '',
          is_test_run: 'true'
        }
      })

      console.log('✅ Stripe Checkout Session Created Successfully!')
      console.log(`   Checkout URL: ${session.url}`)
      console.log(`   Session ID: ${session.id}`)
    } catch (err: any) {
      console.error('❌ Stripe Checkout Session Failed:', err.message)
      allPassed = false
    }
  }

  console.log('\n=====================================================')
  if (allPassed) {
    console.log('  🎯 ALL SYSTEMS OPERATIONAL & READY FOR COMMERCE!')
  } else {
    console.log('  ⚠️ SOME CHECKS FAILED - REVIEW ABOVE LOGS')
  }
  console.log('=====================================================\n')

  await prisma.$disconnect()
}

runPipelineDiagnostics().catch(console.error)
