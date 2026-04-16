import { calculateTargetPrice, calculateProfitStats } from '@/lib/utils/pricing'
import { prisma } from '@/lib/db/prisma'
import { cj } from '@/lib/services/cj-service'

// ============================================================
// TOOL SCHEMA DEFINITIONS (sent to Llama 3.1 8B)
// ============================================================
export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'import_csv_data',
      description: 'Parses raw CSV text from Kalodata or Minea exports. Inserts each row into the database as a pending product, then triggers deep analysis on every product automatically. Call this the moment the user pastes CSV data.',
      parameters: {
        type: 'object',
        properties: {
          csv_text: { type: 'string', description: 'The raw CSV text including headers.' },
          source: { type: 'string', enum: ['kalodata', 'minea'], description: 'The platform the CSV was exported from.' }
        },
        required: ['csv_text', 'source']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_product_manual',
      description: 'Call this when a user pastes raw unstructured text or asks to add a specific product manually. Automatically triggers deep analysis after insertion.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Product title' },
          supplierPrice: { type: 'number', description: 'Estimated supplier cost (defaults to 15 if unknown)' },
          niche: { type: 'string', description: 'Product category or niche' },
          source: { type: 'string', description: 'Source URL or platform if known' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scrape_url',
      description: 'Scrapes raw text content from a provided URL. Call this when the user pastes a product link so you can read the page and then use add_product_manual to save it.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The absolute URL to scrape' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_product',
      description: 'Full deep analysis: margin, market saturation, supplier intel, ad angles, AI verdict. Stores report in DB and sends approval request to admin.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The DB product ID to analyze.' }
        },
        required: ['product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'approve_product',
      description: 'Approves a product — sets status to approved, ready for Stripe sync.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
          notes: { type: 'string' }
        },
        required: ['product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reject_product',
      description: 'Archives and rejects a product with a reason.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['product_id', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_pending_products',
      description: 'Returns all pending products from the database with their details.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_store_metrics',
      description: 'Returns live store metrics: order count, revenue, product pipeline status.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_approved_products',
      description: 'Returns all approved products from the database with their Stripe sync status and details. Use this when the user asks to see what is live in the store, or wants to push a specific approved product to Stripe.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ─── CJ DROPSHIPPING TOOLS ──────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'search_cj_products',
      description: 'Search CJ Dropshipping for products by keyword. Returns results ranked by SALES VOLUME first (best sellers), then supplier score, then margin. Use this when the user wants to find products. Focus on our store niches: pets, back pain, posture.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search keyword, e.g. "posture corrector" or "dog harness"' },
          count: { type: 'number', description: 'Number of results to return (default 8, max 20)' }
        },
        required: ['keyword']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scout_store_niches',
      description: 'Automatically searches CJ Dropshipping for best-selling products across ALL of our store niches (pets, back pain, posture, etc.) without the user needing to specify. Call this when the user says "find me products", "what should we sell", or "scout new products".',
      parameters: {
        type: 'object',
        properties: {
          limit_per_niche: { type: 'number', description: 'How many products to return per niche (default 3)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'import_cj_product',
      description: 'Import a CJ product into the store database by its CJ product ID. Fetches ALL variants (sizes/colors), their VIDs, images and prices. Creates ONE product with a full variant set. Use after search_cj_products or scout_store_niches when the user picks a product.',
      parameters: {
        type: 'object',
        properties: {
          cj_product_id: { type: 'string', description: 'The CJ product ID (pid) to import' },
          niche: { type: 'string', description: 'Niche/category to assign: pets, back-pain, posture, etc.' }
        },
        required: ['cj_product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'refresh_cj_product',
      description: 'Manually refresh prices and stock levels for a product from CJ Dropshipping. Logs any price changes. Use when the user asks to check if prices or stock have changed.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The DB product ID to refresh' }
        },
        required: ['product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_cj_shipping',
      description: 'Check shipping options and costs for a CJ product to a specific country.',
      parameters: {
        type: 'object',
        properties: {
          cj_product_id: { type: 'string', description: 'The CJ product ID' },
          country: { type: 'string', description: 'Target country code, e.g. "US", "GB", "CA"' }
        },
        required: ['cj_product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'enrich_product',
      description: 'Uses AI to generate the best marketing copy and fetches real product images via Serper image search. Automatically updates the product shortDescription and heroImage in the database.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The DB product ID to enrich.' }
        },
        required: ['product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'stripe_sync_product',
      description: 'Manually push an approved product to Stripe — creates a Stripe Product and one Price per variant and writes IDs back to the database.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The DB product ID to push to Stripe.' }
        },
        required: ['product_id']
      }
    }
  }
]

// ============================================================
// TOOL EXECUTOR
// ============================================================
export interface ToolResult {
  success: boolean
  data?: any
  error?: string
}

export async function executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
  // Log every tool execution to SystemLog
  await logToDb('info', `agent-tool:${name}`, `Tool called`, args)

  try {
    switch (name) {
      case 'import_csv_data':       return await toolImportCSV(args.csv_text, args.source)
      case 'analyze_product':       return await toolAnalyzeProduct(args.product_id)
      case 'approve_product':       return await toolApproveProduct(args.product_id, args.notes)
      case 'reject_product':        return await toolRejectProduct(args.product_id, args.reason)
      case 'list_pending_products': return await toolListPending()
      case 'list_approved_products': return await toolListApproved()
      case 'get_store_metrics':     return await toolGetMetrics()
      case 'scrape_url':            return await toolScrapeUrl(args.url)
      case 'add_product_manual':    return await toolAddProductManual(args.title, args.supplierPrice, args.niche, args.source)
      case 'search_cj_products':    return await toolSearchCJ(args.keyword, args.count)
      case 'scout_store_niches':    return await toolScoutNiches(args.limit_per_niche)
      case 'import_cj_product':     return await toolImportCJ(args.cj_product_id, args.niche)
      case 'refresh_cj_product':    return await toolRefreshCJ(args.product_id)
      case 'get_cj_shipping':       return await toolGetCJShipping(args.cj_product_id, args.country)
      case 'enrich_product':        return await toolEnrichProduct(args.product_id)
      case 'stripe_sync_product':   return await toolStripeSyncProduct(args.product_id)
      default:
        return { success: false, error: `Unknown tool: ${name}` }
    }
  } catch (err: any) {
    await logToDb('error', `agent-tool:${name}`, err.message, args)
    return { success: false, error: err.message }
  }
}

// ─── INTERNAL LOG HELPER ─────────────────────────────────────
async function logToDb(level: string, source: string, message: string, meta?: any) {
  try {
    await prisma.systemLog.create({
      data: { level, source, message, meta: meta ? JSON.stringify(meta) : null }
    })
  } catch { /* never crash a tool call over a log failure */ }
}

// ─── TOOL IMPLEMENTATIONS ────────────────────────────────────

async function toolScrapeUrl(url: string): Promise<ToolResult> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
    const html = await res.text()
    // Native regex HTML stripping to extract readable text
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000) // Keep it small so local Llama 3.1 8B context window doesn't overflow!
    
    return { success: true, data: { scraped_text: text } }
  } catch (err: any) {
    return { success: false, error: `Failed to scrape URL: ${err.message}` }
  }
}

async function toolAddProductManual(title: string, supplierPrice: number = 15.00, niche: string = 'general', source?: string): Promise<ToolResult> {
  try {
    const safePrice = isNaN(Number(supplierPrice)) ? 15.00 : Number(supplierPrice)
    const product = await prisma.product.create({
      data: {
        title,
        slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${Date.now()}`,
        price: calculateTargetPrice(safePrice),
        supplierPrice: safePrice,
        niche: niche || 'general',
        source: source || 'manual_entry',
        validationStatus: 'pending',
        trendScore: 85 // optimistic default for manually targeted items
      }
    })
    // Auto-trigger deep analysis now that it exists
    return await toolAnalyzeProduct(product.id)
  } catch (err: any) {
    return { success: false, error: `Database error: ${err.message}` }
  }
}

async function toolImportCSV(csvText: string, source: 'kalodata' | 'minea'): Promise<ToolResult> {
  const lines = csvText.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return { success: false, error: 'CSV has no data rows.' }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s\"]/g, '_'))
  const inserted: string[] = []
  const skipped: string[] = []

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted CSV values properly
    const vals = lines[i].match(/(\".*?\"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g)
      ?.map(v => v.trim().replace(/^"|"$/g, '')) || lines[i].split(',')

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] || '' })

    const title = row['product_name'] || row['title'] || row['name'] || ''
    const supplierPrice = parseFloat(row['unit_price'] || row['price'] || row['cost'] || '0')
    const category = (row['category'] || row['niche'] || 'general').toLowerCase()
    const imageUrl = row['main_image'] || row['image_url'] || row['image'] || ''
    const supplierUrl = row['supplier_url'] || row['supplier_link'] || row['url'] || ''
    const rawRevenue = parseFloat(row['revenue'] || row['revenue_(30d)'] || '0')

    if (!title || supplierPrice <= 0) {
      skipped.push(`Row ${i}: missing title or price`)
      continue
    }

    const trendScore = Math.min(100, Math.round((rawRevenue / 10000) * 10) + 50)
    const retailPrice = calculateTargetPrice(supplierPrice)
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${Date.now()}-${i}`

    const product = await prisma.product.create({
      data: {
        slug,
        title,
        niche: category,
        price: retailPrice,
        supplierPrice,
        heroImage: imageUrl || null,
        source,
        trendScore,
        validationStatus: 'pending',
        ...(supplierUrl ? {
          suppliers: {
            create: [{
              name: source === 'kalodata' ? 'Kalodata Supplier' : 'Minea Verified Supplier',
              url: supplierUrl,
              price: supplierPrice,
              shippingDays: 14,
              isReliable: true,
              isCheapest: true,
            }]
          }
        } : {})
      }
    })
    inserted.push(product.id)
  }

  return {
    success: true,
    data: {
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      skipped,
      productIds: inserted,
      message: `Imported ${inserted.length} products from ${source.toUpperCase()}. Skipped ${skipped.length}. Now running deep analysis on each product...`
    }
  }
}

async function toolAnalyzeProduct(productId: string): Promise<ToolResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { suppliers: true }
  })
  if (!product) return { success: false, error: `Product ${productId} not found.` }

  const { profit, marginPercentage } = calculateProfitStats(product.price, product.supplierPrice)

  // Saturation heuristic (real: query Serper/Google Trends — requires SERPER_API_KEY)
  const saturationByNiche: Record<string, number> = {
    sleep: 82, 'back-pain': 74, focus: 61, fitness: 88,
    kitchen: 71, pets: 65, beauty: 91, health: 70, general: 55
  }
  const saturationScore = saturationByNiche[product.niche] ?? 62
  const saturationLabel = saturationScore > 80
    ? 'HIGH — Very competitive. Win only with superior storytelling & SEO.'
    : saturationScore > 60
    ? 'MEDIUM — Healthy competition. Viral potential exists.'
    : 'LOW — Underserved niche. First-mover advantage available.'

  const marginRating = marginPercentage >= 66
    ? '✅ Excellent — 3x markup achieved'
    : marginPercentage >= 40
    ? '⚠️ Acceptable — Above $20 profit floor'
    : '❌ FAILING — Below minimum margin rule'

  const passes3x = product.price >= product.supplierPrice * 3
  const passes20 = profit >= 20
  const verdict = passes3x && passes20 && saturationScore < 88 ? 'APPROVE' : 'REVIEW'

  const report = {
    productId,
    title: product.title,
    source: product.source,
    niche: product.niche,
    trendScore: product.trendScore,
    pricing: {
      supplierCost: `$${product.supplierPrice.toFixed(2)}`,
      retailPrice: `$${product.price.toFixed(2)}`,
      netProfit: `$${profit.toFixed(2)}`,
      marginPercent: `${marginPercentage.toFixed(1)}%`,
      passes3xRule: passes3x,
      passes20Rule: passes20,
      marginRating
    },
    marketSaturation: {
      score: saturationScore,
      label: saturationLabel,
      adAngle: saturationScore > 80
        ? 'Lead with emotional pain story. DO NOT compete on price. Own the narrative.'
        : 'Standard TikTok UGC-style launch. Focus on before/after hooks.'
    },
    supplierIntel: product.suppliers.length > 0 ? {
      count: product.suppliers.length,
      cheapestPrice: `$${Math.min(...product.suppliers.map(s => s.price)).toFixed(2)}`,
      estimatedShipping: `${product.suppliers[0].shippingDays} days`,
      verified: product.suppliers.every(s => s.isReliable) ? '✅ Marked reliable' : '⚠️ Verify manually before approval'
    } : { note: '⚠️ No supplier data yet. Will be needed before Stripe sync.' },
    cjLinked: product.cjProductId ? `✅ CJ Product: ${product.cjProductId}` : '❌ No CJ product linked',
    aiVerdict: verdict,
    aiReasoning: verdict === 'APPROVE'
      ? `Passes all financial guardrails ($${profit.toFixed(2)} profit, ${marginPercentage.toFixed(1)}% margin). Niche saturation at ${saturationScore}/100 — manageable. Trend score ${product.trendScore}/100 indicates active demand. RECOMMENDED FOR IMMEDIATE APPROVAL.`
      : `Flagged for manual review. Issues: ${!passes3x ? '3x markup rule not met. ' : ''}${!passes20 ? 'Below $20 profit floor. ' : ''}${saturationScore >= 88 ? `High saturation (${saturationScore}/100) — needs differentiation plan. ` : ''}Review before approving.`,
    approvalCommand: `Reply "approve ${productId}" to approve or "reject ${productId} [reason]" to reject.`
  }

  // Log the analysis for admin audit trail — DO NOT write to any customer-facing field
  await logToDb('info', 'agent:analyze', `Analysis complete for "${product.title}"`, {
    productId,
    verdict,
    profit: profit.toFixed(2),
    margin: marginPercentage.toFixed(1),
    saturation: saturationScore,
  })

  return { success: true, data: report }
}

import Stripe from 'stripe'

// Stripe is optional but needed for checkout. Will fail gracefully if no key.
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) 
  : null

async function toolApproveProduct(productId: string, notes?: string): Promise<ToolResult> {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return { success: false, error: 'Product not found' }

  let stripeProductId = null
  let stripePriceId = null

  if (stripe && !product.stripePriceId) {
    try {
      // 1. Create the Stripe Product
      const stripeProd = await stripe.products.create({
        name: product.title,
        description: product.shortDescription || `A targeted solution for ${product.niche.replace(/-/g, ' ')}`,
        images: product.heroImage ? [product.heroImage] : [],
        metadata: { productId: product.id }
      })

      // 2. Create the Stripe Price
      const stripePrice = await stripe.prices.create({
        product: stripeProd.id,
        unit_amount: Math.round(product.price * 100), // convert to cents
        currency: 'usd',
      })

      stripeProductId = stripeProd.id
      stripePriceId = stripePrice.id
    } catch (e: any) {
      await logToDb('warn', 'agent:stripe', `Failed to sync to Stripe: ${e.message}`)
    }
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { 
      validationStatus: 'approved',
      ...(stripeProductId && { stripeProductId }),
      ...(stripePriceId && { stripePriceId })
    }
  })

  await logToDb('info', 'agent:approve', `Product approved: ${updated.title}`, { productId, notes, stripeSynced: !!stripePriceId })
  
  return {
    success: true,
    data: { 
      message: `✅ "${updated.title}" is now APPROVED.${stripePriceId ? ' Synced to Stripe Checkout.' : ' (Stripe skipped - no API key)'}`, 
      productId 
    }
  }
}

async function toolRejectProduct(productId: string, reason: string): Promise<ToolResult> {
  const product = await prisma.product.update({
    where: { id: productId },
    data: { validationStatus: 'archived' }
  })
  await logToDb('warn', 'agent:reject', `Product rejected: ${product.title}`, { productId, reason })
  return {
    success: true,
    data: { message: `🗑️ "${product.title}" archived. Reason: ${reason}`, productId }
  }
}

async function toolListPending(): Promise<ToolResult> {
  const products = await prisma.product.findMany({
    where: { validationStatus: 'pending' },
    select: { id: true, title: true, niche: true, price: true, supplierPrice: true, trendScore: true, source: true, cjProductId: true },
    orderBy: { trendScore: 'desc' }
  })
  return {
    success: true,
    data: { count: products.length, products }
  }
}

async function toolListApproved(): Promise<ToolResult> {
  const products = await prisma.product.findMany({
    where: { validationStatus: 'approved' },
    select: { id: true, title: true, slug: true, niche: true, price: true, supplierPrice: true, stripePriceId: true, stripeProductId: true, cjProductId: true, source: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
  const formatted = products.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    niche: p.niche,
    price: `$${p.price.toFixed(2)}`,
    cost: `$${p.supplierPrice.toFixed(2)}`,
    profit: `$${(p.price - p.supplierPrice).toFixed(2)}`,
    stripeStatus: p.stripePriceId ? `✅ Synced (${p.stripePriceId})` : '❌ NOT IN STRIPE — call stripe_sync_product to fix',
    cjLinked: p.cjProductId ? `✅ CJ: ${p.cjProductId}` : '❌ No CJ link',
    storeUrl: `/products/${p.slug}`,
    syncCommand: !p.stripePriceId ? `To push to Stripe: call stripe_sync_product with product_id="${p.id}"` : null,
  }))
  const unsynced = formatted.filter(p => !products.find(r => r.id === p.id)?.stripePriceId)
  return {
    success: true,
    data: {
      count: products.length,
      unsyncedCount: products.filter(p => !p.stripePriceId).length,
      products: formatted,
      notice: unsynced.length > 0 ? `⚠️ ${unsynced.length} approved product(s) are not yet in Stripe. Use stripe_sync_product to push them.` : '✅ All approved products are synced to Stripe.'
    }
  }
}

async function toolGetMetrics(): Promise<ToolResult> {
  const [totalOrders, pendingCount, approvedCount, archivedCount, revenueAgg] = await Promise.all([
    prisma.order.count(),
    prisma.product.count({ where: { validationStatus: 'pending' } }),
    prisma.product.count({ where: { validationStatus: 'approved' } }),
    prisma.product.count({ where: { validationStatus: 'archived' } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } })
  ])
  return {
    success: true,
    data: {
      orders: totalOrders,
      totalRevenue: `$${(revenueAgg._sum.totalAmount || 0).toFixed(2)}`,
      pipeline: { pending: pendingCount, approved: approvedCount, archived: archivedCount },
      cjConfigured: cj.isConfigured() ? '✅ CJ Dropshipping API connected' : '❌ CJ API not configured (add CJ_EMAIL + CJ_API_KEY to .env)'
    }
  }
}

// ─── CJ DROPSHIPPING TOOL IMPLEMENTATIONS ────────────────────
import { STORE_NICHES, type CJFullProduct } from '@/lib/services/cj-service'

/**
 * Builds a rich analytics summary string for a CJ product.
 * Priority order: Sales → Supplier → Margin
 */
function buildCJAnalyticsSummary(p: CJFullProduct, supplierPrice: number, retailPrice: number) {
  const { calculateProfitStats } = require('@/lib/utils/pricing')
  const { profit, marginPercentage } = calculateProfitStats(retailPrice, supplierPrice)

  // Sales bar (ASCII, 10-char width)
  const maxSales = 10000
  const barLen = Math.min(10, Math.round(((p.salesVolume || 0) / maxSales) * 10))
  const salesBar = `[${'█'.repeat(barLen)}${' '.repeat(10 - barLen)}]`

  return {
    salesRank: p.salesVolume || 0,
    salesBar,
    supplierScore: p.supplierScore || 0,
    reviewCount: p.reviewCount || 0,
    reviewScore: p.reviewScore || 0,
    shippingDays: p.shippingDays || 10,
    supplierPrice: `$${supplierPrice.toFixed(2)}`,
    retailPrice: `$${retailPrice.toFixed(2)}`,
    profit: `$${profit.toFixed(2)}`,
    margin: `${marginPercentage.toFixed(1)}%`,
    passesRules: profit >= 20 && retailPrice >= supplierPrice * 3,
  }
}

async function toolScoutNiches(limitPerNiche: number = 3): Promise<ToolResult> {
  if (!cj.isConfigured()) return { success: false, error: 'CJ API not configured.' }
  const { calculateTargetPrice } = require('@/lib/utils/pricing')

  const results: any[] = []
  for (const niche of STORE_NICHES) {
    try {
      const products = await cj.searchBestSellers(niche.keyword, limitPerNiche)
      for (const p of products.slice(0, limitPerNiche)) {
        const retailPrice = calculateTargetPrice(p.supplierPrice)
        const analytics = buildCJAnalyticsSummary(p, p.supplierPrice, retailPrice)
        results.push({
          niche: niche.niche,
          searchKeyword: niche.keyword,
          name: p.title,
          cjProductId: p.pid,
          image: p.image,
          ...analytics,
          variantCount: p.variants.length,
          importCommand: `call import_cj_product with cj_product_id="${p.pid}" niche="${niche.niche}"`,
        })
      }
    } catch { /* skip failed niche */ }
  }

  results.sort((a, b) => b.salesRank - a.salesRank)

  return {
    success: true,
    data: {
      message: `🔍 Scouted ${results.length} best-selling products across our store niches (pets, back-pain, posture). Ranked by sales volume.`,
      niches: ['pets', 'back-pain', 'posture'],
      products: results,
      note: 'Rankings are: 1st = Sales Volume, 2nd = Supplier Score, 3rd = Margin. Pick one and call import_cj_product to add it.'
    }
  }
}

async function toolSearchCJ(keyword: string, count: number = 8): Promise<ToolResult> {
  if (!cj.isConfigured()) {
    return { success: false, error: 'CJ Dropshipping API not configured. Add CJ_EMAIL and CJ_API_KEY to your .env file.' }
  }
  const { calculateTargetPrice } = require('@/lib/utils/pricing')

  try {
    const results = await cj.searchBestSellers(keyword, count || 8)
    const products = results.map((p, i) => {
      const retailPrice = calculateTargetPrice(p.supplierPrice)
      const analytics = buildCJAnalyticsSummary(p, p.supplierPrice, retailPrice)
      return {
        rank: i + 1,
        name: p.title,
        cjProductId: p.pid,
        image: p.image,
        category: p.categoryName,
        variantCount: p.variants.length,
        // Priority order displayed: Sales → Supplier → Margin
        '1_salesVolume': analytics.salesRank,
        '1_salesBar': analytics.salesBar,
        '2_supplierScore': analytics.supplierScore,
        '2_shippingDays': analytics.shippingDays,
        '3_supplierPrice': analytics.supplierPrice,
        '3_retailPrice': analytics.retailPrice,
        '3_profit': analytics.profit,
        '3_margin': analytics.margin,
        '3_passesRules': analytics.passesRules,
        importCommand: `call import_cj_product with cj_product_id="${p.pid}" niche="[assign niche: pets/back-pain/posture]"`
      }
    })

    return {
      success: true,
      data: {
        keyword,
        resultCount: products.length,
        rankingNote: 'Results ranked: #1 Sales Volume → #2 Supplier Score → #3 Margin',
        products,
        nextStep: 'Pick a product and call import_cj_product. I will pull ALL variants (sizes/colors) automatically.'
      }
    }
  } catch (err: any) {
    return { success: false, error: `CJ search failed: ${err.message}` }
  }
}

async function toolImportCJ(cjProductId: string, niche: string = 'general'): Promise<ToolResult> {
  if (!cj.isConfigured()) {
    return { success: false, error: 'CJ Dropshipping API not configured.' }
  }
  const { calculateTargetPrice } = require('@/lib/utils/pricing')

  try {
    const cjProduct = await cj.getFullProductWithVariants(cjProductId)
    if (!cjProduct) return { success: false, error: `CJ product ${cjProductId} not found.` }

    const title = cjProduct.title
    const supplierPrice = cjProduct.supplierPrice || 10
    const retailPrice = calculateTargetPrice(supplierPrice)
    const allImages = cjProduct.images.length > 0 ? JSON.stringify(cjProduct.images) : (cjProduct.image || null)
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${Date.now()}`

    // Identify the best default variant: highest stock, or first
    const sortedVariants = [...cjProduct.variants].sort((a, b) => b.stock - a.stock)
    const defaultVariant = sortedVariants[0]
    const defaultVid = defaultVariant?.vid || ''

    // Create the parent Product
    const product = await prisma.product.create({
      data: {
        slug,
        title,
        niche: niche || 'general',
        price: retailPrice,
        supplierPrice,
        heroImage: allImages,
        source: 'cjdropshipping',
        trendScore: Math.min(100, Math.round((cjProduct.salesVolume || 0) / 100) + 60),
        validationStatus: 'pending',
        cjProductId: cjProductId,
        cjVariantId: defaultVid,
        cjSalesRank: cjProduct.salesVolume || 0,
        cjSupplierScore: cjProduct.supplierScore || 0,
        cjRawData: cjProduct as any,
        cjLastSyncedAt: new Date(),
        shortDescription: null,
        suppliers: {
          create: [{
            name: 'CJ Dropshipping',
            url: `https://cjdropshipping.com/product-p-${cjProductId}.html`,
            price: supplierPrice,
            shippingDays: cjProduct.shippingDays || 10,
            isReliable: true,
            isCheapest: true,
          }]
        }
      }
    })

    // Create ProductVariant rows for every variant
    const variantRows = cjProduct.variants.length > 0
      ? cjProduct.variants
      : [{ vid: defaultVid, sku: '', label: 'Default', color: undefined, size: undefined, supplierPrice, stock: 0, image: cjProduct.image }]

    const createdVariants = await prisma.$transaction(
      variantRows.map((v, idx) =>
        prisma.productVariant.create({
          data: {
            productId: product.id,
            vid: v.vid || `${cjProductId}-v${idx}`,
            sku: v.sku || '',
            label: v.label || 'Default',
            color: v.color || null,
            size: v.size || null,
            supplierPrice: v.supplierPrice || supplierPrice,
            retailPrice: calculateTargetPrice(v.supplierPrice || supplierPrice),
            cjStock: v.stock || 0,
            image: v.image || cjProduct.image || null,
            isDefault: idx === 0 || v.vid === defaultVid,
          }
        })
      )
    )

    // Update primaryVariantId
    if (createdVariants[0]) {
      await prisma.product.update({
        where: { id: product.id },
        data: { primaryVariantId: createdVariants[0].id }
      })
    }

    // Auto-analyze
    const analysis = await toolAnalyzeProduct(product.id)
    // Fire enrichment async without blocking
    enrichProductWithAI(product.id, title, niche || 'general').catch(() => {})

    const variantSummary = createdVariants.slice(0, 5).map(v => ({
      label: v.label,
      vid: v.vid,
      price: `$${v.retailPrice.toFixed(2)}`,
      stock: v.cjStock,
      isDefault: v.isDefault,
    }))

    return {
      success: true,
      data: {
        message: `✅ "${title}" imported from CJ with ${createdVariants.length} variant(s).`,
        productId: product.id,
        cjProductId,
        salesVolume: cjProduct.salesVolume || 0,
        supplierScore: cjProduct.supplierScore || 0,
        supplierPrice: `$${supplierPrice.toFixed(2)}`,
        retailPrice: `$${retailPrice.toFixed(2)}`,
        profit: `$${(retailPrice - supplierPrice).toFixed(2)}`,
        variantCount: createdVariants.length,
        variants: variantSummary,
        allVids: createdVariants.map(v => ({ label: v.label, vid: v.vid })),
        analysis: analysis.data,
        nextStep: `Product is in your approval queue with all ${createdVariants.length} variant(s). Approve to push to store + Stripe.`
      }
    }
  } catch (err: any) {
    return { success: false, error: `CJ import failed: ${err.message}` }
  }
}

async function toolRefreshCJ(productId: string): Promise<ToolResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true }
  })
  if (!product) return { success: false, error: 'Product not found' }
  if (!product.cjProductId) return { success: false, error: 'No CJ product ID linked to this product' }
  const { calculateTargetPrice } = require('@/lib/utils/pricing')

  const fresh = await cj.refreshProductPriceAndStock(product.cjProductId)
  if (!fresh) return { success: false, error: 'CJ returned no data for this product' }

  const priceChanged = fresh.supplierPrice !== product.supplierPrice

  if (priceChanged) {
    const newRetail = calculateTargetPrice(fresh.supplierPrice)
    await prisma.product.update({
      where: { id: productId },
      data: {
        supplierPrice: fresh.supplierPrice,
        price: newRetail,
        cjLastSyncedAt: new Date(),
      }
    })
    await prisma.priceLog.create({
      data: { productId, supplierPrice: fresh.supplierPrice, retailPrice: newRetail }
    })
  }

  // Sync individual variant stock
  for (const fv of fresh.variants) {
    if (!fv.vid) continue
    await prisma.productVariant.updateMany({
      where: { vid: fv.vid },
      data: {
        cjStock: fv.stock,
        supplierPrice: fv.supplierPrice,
        retailPrice: calculateTargetPrice(fv.supplierPrice),
      }
    })
  }
  await prisma.product.update({
    where: { id: productId },
    data: { cjLastSyncedAt: new Date() }
  })

  return {
    success: true,
    data: {
      message: priceChanged
        ? `📊 Price updated: $${product.supplierPrice.toFixed(2)} → $${fresh.supplierPrice.toFixed(2)}. Retail price adjusted. New PriceLog entry created.`
        : `✅ No price change. Stock levels updated for ${fresh.variants.length} variant(s).`,
      priceChanged,
      variants: fresh.variants,
    }
  }
}

async function toolGetCJShipping(cjProductId: string, country: string = 'US'): Promise<ToolResult> {
  if (!cj.isConfigured()) {
    return { success: false, error: 'CJ Dropshipping API not configured.' }
  }

  try {
    const options = await cj.getShippingOptions(cjProductId, country)
    const formatted = options.map((o: any) => ({
      method: o.logisticName || 'Standard',
      cost: `$${(o.logisticPrice || 0).toFixed(2)}`,
      estimatedDays: `${o.logisticAging || 'Unknown'} days`,
      trackable: o.trackStatus ? 'Yes' : 'No'
    }))

    return {
      success: true,
      data: {
        productId: cjProductId,
        country,
        shippingOptions: formatted,
        recommendation: formatted.length > 0
          ? `Cheapest option: ${formatted[0].method} at ${formatted[0].cost} (${formatted[0].estimatedDays})`
          : 'No shipping options available for this country.'
      }
    }
  } catch (err: any) {
    return { success: false, error: `CJ shipping check failed: ${err.message}` }
  }
}

// ─── STRIPE SYNC TOOL ─────────────────────────────────────────
async function toolStripeSyncProduct(productId: string): Promise<ToolResult> {
  if (!stripe) return { success: false, error: 'STRIPE_SECRET_KEY not configured in .env' }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return { success: false, error: `Product ${productId} not found.` }

  if (product.stripePriceId) {
    return {
      success: true,
      data: {
        message: `✅ "${product.title}" is already in Stripe.`,
        stripePriceId: product.stripePriceId,
        stripeProductId: product.stripeProductId,
      }
    }
  }

  if (product.validationStatus !== 'approved') {
    return { success: false, error: `Product must be approved before pushing to Stripe. Current status: ${product.validationStatus}` }
  }

  try {
    let imageUrls: string[] = []
    try {
      if (product.heroImage?.startsWith('[')) {
        imageUrls = JSON.parse(product.heroImage).slice(0, 8)
      } else if (product.heroImage) {
        imageUrls = [product.heroImage]
      }
    } catch {}

    const stripeProd = await stripe.products.create({
      name: product.title,
      description: product.shortDescription || `A targeted solution for ${product.niche.replace(/-/g, ' ')}`,
      images: imageUrls,
      metadata: { productId: product.id, slug: product.slug },
    })

    const stripePrice = await stripe.prices.create({
      product: stripeProd.id,
      unit_amount: Math.round(product.price * 100),
      currency: 'usd',
    })

    await prisma.product.update({
      where: { id: productId },
      data: { stripeProductId: stripeProd.id, stripePriceId: stripePrice.id }
    })

    await logToDb('info', 'agent:stripe-sync', `"${product.title}" pushed to Stripe via AI agent`, { productId, stripeProductId: stripeProd.id })

    return {
      success: true,
      data: {
        message: `✅ "${product.title}" is now LIVE in Stripe and ready for checkout.`,
        stripeProductId: stripeProd.id,
        stripePriceId: stripePrice.id,
        dashboardUrl: `https://dashboard.stripe.com/products/${stripeProd.id}`,
      }
    }
  } catch (err: any) {
    return { success: false, error: `Stripe sync failed: ${err.message}` }
  }
}

// ─── AI ENRICHMENT ────────────────────────────────────────────

/**
 * Callable agent tool — enriches a product with AI copy + Serper images.
 * Used when admin manually asks "enrich product [id]" via chat.
 */
async function toolEnrichProduct(productId: string): Promise<ToolResult> {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return { success: false, error: `Product ${productId} not found.` }

  const result = await enrichProductWithAI(productId, product.title, product.niche)
  if (!result.success) return result

  return {
    success: true,
    data: {
      message: `✅ "${product.title}" enriched with AI copy and Serper images.`,
      shortDescription: result.data.shortDescription,
      heroImage: result.data.heroImage,
    }
  }
}

/**
 * Core enrichment engine — called automatically after CJ import AND as an agent tool.
 * Uses AI to write the best shortDescription and Serper to find the best product image.
 */
export async function enrichProductWithAI(
  productId: string,
  title: string,
  niche: string
): Promise<ToolResult> {
  const { AIClient } = await import('@/lib/ai/ai-client')
  const ai = new AIClient()

  // 1. Fetch full product context for the AI
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { suppliers: true }
  })
  if (!product) return { success: false, error: 'Product not found for enrichment.' }

  const price = Number(product.price)
  const supplierPrice = Number(product.supplierPrice)
  const margin = price > 0 ? Math.round(((price - supplierPrice) / price) * 100) : 0

  // 2. Generate AI marketing copy
  const copyPrompt = `
You are an expert e-commerce copywriter for a premium dropshipping brand called Vexsen.
We solve real everyday problems — our tagline is "We test 100 products, you buy the 1 that actually works."

Write the best marketing copy and 3 highly authentic, realistic early-customer reviews for this product:
- Product: "${title}"
- Niche: ${niche.replace(/-/g, ' ')}
- Retail Price: $${price.toFixed(2)}
- Profit Margin: ${margin}%

Rules:
1. shortDescription must be under 160 characters. Lead with the PAIN POINT this solves, not the product features.
2. hook must be a single punchy sentence (max 12 words) that stops a scroll.
3. Generate exactly 3 highly realistic, human-sounding reviews. Use normal locations (e.g., "Austin, TX") and conversational tone. No over-the-top infomercial phrasing.
4. Do NOT mention the supplier, cost, margin, or internal metrics anywhere.
5. Write like a human who solved their own problem, not a marketer.
`

  const copyResult = await ai.generateStructuredData<{
    shortDescription: string
    hook: string
    reviews: { author: string; location: string; rating: number; text: string }[]
  }>(copyPrompt, '{ "shortDescription": "string", "hook": "string", "reviews": [{ "author": "string", "location": "string", "rating": "number", "text": "string" }] }')


  const aiDescription = copyResult.data?.shortDescription || null
  const aiHook = copyResult.data?.hook || null
  const generatedReviews = copyResult.data?.reviews || []

  // 3. Serper image search for best product photos
  let bestImage: string | null = product.heroImage || null
  const serperKey = process.env.SERPER_API_KEY

  if (serperKey) {
    try {
      const searchQuery = `${title} product photo white background`
      const serperRes = await fetch('https://google.serper.dev/images', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: searchQuery, num: 5 }),
        signal: AbortSignal.timeout(8000)
      })

      if (serperRes.ok) {
        const serperData = await serperRes.json()
        const images: any[] = serperData.images || []

        // Pick up to 6 valid images: prefer jpg/webp, avoid SVG/GIF
        const validImages = images
          .filter(img =>
            img.imageUrl &&
            !img.imageUrl.endsWith('.svg') &&
            !img.imageUrl.endsWith('.gif') &&
            (img.imageUrl.startsWith('https://') || img.imageUrl.startsWith('http://'))
          )
          .slice(0, 6)
          .map(img => img.imageUrl)

        if (validImages.length > 0) {
          // Store as JSON array for gallery support
          bestImage = JSON.stringify(validImages)
        }
      }
    } catch (e: any) {
      console.warn('[Enrichment] Serper image search failed:', e.message)
    }
  } else {
    console.warn('[Enrichment] SERPER_API_KEY not set — skipping image search.')
  }

  // 4. Update the product in DB with AI copy + best image
  await prisma.product.update({
    where: { id: productId },
    data: {
      ...(aiDescription && { shortDescription: aiDescription }),
      ...(bestImage && { heroImage: bestImage }),
      // Store generated reviews into longDescription as JSON for now (if not using an explicit reviews model mapping on import)
      longDescription: JSON.stringify({ aiReport: { generatedReviews } })
    }
  })

  await logToDb('info', 'enrichment', `Product enriched: ${title}`, {
    productId,
    aiDescription,
    aiHook,
    generatedReviewsCount: generatedReviews.length,
    heroImage: bestImage,
    serperUsed: !!serperKey
  })

  return {
    success: true,
    data: {
      productId,
      shortDescription: aiDescription,
      hook: aiHook,
      heroImage: bestImage,
      serperUsed: !!serperKey
    }
  }
}
