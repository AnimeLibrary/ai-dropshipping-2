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
  // ─── CJ DROPSHIPPING TOOLS ──────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'search_cj_products',
      description: 'Search CJ Dropshipping for products by keyword. Returns product names, images, prices, and CJ product IDs. Use this when the user wants to find products to sell, e.g. "find me a back pain product" or "search CJ for LED lights".',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search keyword, e.g. "posture corrector" or "LED strip lights"' },
          count: { type: 'number', description: 'Number of results to return (default 5, max 20)' }
        },
        required: ['keyword']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'import_cj_product',
      description: 'Import a specific CJ Dropshipping product into the store database by its CJ product ID. Pulls all details (images, variants, pricing) from the CJ API and creates a pending product ready for approval. Use after search_cj_products when the user picks a product.',
      parameters: {
        type: 'object',
        properties: {
          cj_product_id: { type: 'string', description: 'The CJ product ID (pid) to import' },
          niche: { type: 'string', description: 'What niche/category to assign this product to' }
        },
        required: ['cj_product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_cj_shipping',
      description: 'Check shipping options and costs for a CJ product to a specific country. Use when the user asks about shipping times or costs.',
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
      description: 'Uses AI to generate the best marketing copy and fetches real product images via Serper image search. Automatically updates the product shortDescription and heroImage in the database. Call this on any product that needs better copy or images — especially after import_cj_product.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The DB product ID to enrich.' }
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
      case 'get_store_metrics':     return await toolGetMetrics()
      case 'scrape_url':            return await toolScrapeUrl(args.url)
      case 'add_product_manual':    return await toolAddProductManual(args.title, args.supplierPrice, args.niche, args.source)
      case 'search_cj_products':    return await toolSearchCJ(args.keyword, args.count)
      case 'import_cj_product':     return await toolImportCJ(args.cj_product_id, args.niche)
      case 'get_cj_shipping':       return await toolGetCJShipping(args.cj_product_id, args.country)
      case 'enrich_product':        return await toolEnrichProduct(args.product_id)
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

  // Store the full analysis report in the product record
  await prisma.product.update({
    where: { id: productId },
    data: { longDescription: JSON.stringify(report, null, 2) }
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

async function toolSearchCJ(keyword: string, count: number = 5): Promise<ToolResult> {
  if (!cj.isConfigured()) {
    return { success: false, error: 'CJ Dropshipping API not configured. Add CJ_EMAIL and CJ_API_KEY to your .env file. Sign up free at cjdropshipping.com' }
  }

  try {
    const results = await cj.searchProduct(keyword)
    const limited = results.slice(0, count || 5)

    const products = limited.map((p: any, i: number) => ({
      rank: i + 1,
      name: p.productNameEn || p.productName || 'Unknown',
      cjProductId: p.pid,
      price: `$${(p.sellPrice || 0).toFixed(2)}`,
      image: p.productImage || '',
      category: p.categoryName || 'general',
      variants: p.variantCount || 1,
      importCommand: `To import this: call import_cj_product with cj_product_id="${p.pid}"`
    }))

    return {
      success: true,
      data: {
        keyword,
        resultCount: products.length,
        products,
        nextStep: `Tell the user which products look interesting. When they pick one, call import_cj_product with the cj_product_id to add it to the store.`
      }
    }
  } catch (err: any) {
    return { success: false, error: `CJ search failed: ${err.message}` }
  }
}

async function toolImportCJ(cjProductId: string, niche: string = 'general'): Promise<ToolResult> {
  if (!cj.isConfigured()) {
    return { success: false, error: 'CJ Dropshipping API not configured. Add CJ_EMAIL and CJ_API_KEY to your .env file.' }
  }

  try {
    const cjProduct = await cj.getProduct(cjProductId)
    if (!cjProduct) {
      return { success: false, error: `CJ product ${cjProductId} not found.` }
    }

    const title = cjProduct.productNameEn || cjProduct.productName || 'CJ Product'
    const rawPrice = String(cjProduct.sellPrice || cjProduct.productPrice || 10)
    const parsedPrice = parseFloat(rawPrice.split('-')[0])
    const supplierPrice = isNaN(parsedPrice) ? 10 : parsedPrice
    const retailPrice = calculateTargetPrice(supplierPrice)
    const image = cjProduct.productImage || ''
    
    // Get the first/default variant ID for order placement
    const firstVariant = cjProduct.variants?.[0]
    const variantId = firstVariant?.vid || ''

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${Date.now()}`

    const product = await prisma.product.create({
      data: {
        slug,
        title,
        niche: niche || 'general',
        price: retailPrice,
        supplierPrice,
        heroImage: image || null,
        source: 'cjdropshipping',
        trendScore: 80,
        validationStatus: 'pending',
        cjProductId: cjProductId,
        cjVariantId: variantId,
        shortDescription: null, // Will be filled by AI enrichment automatically
        suppliers: {
          create: [{
            name: 'CJ Dropshipping',
            url: `https://cjdropshipping.com/product-p-${cjProductId}.html`,
            price: supplierPrice,
            shippingDays: 10,
            isReliable: true,
            isCheapest: true,
          }]
        }
      }
    })

    // Auto-analyze then auto-enrich with AI copy + real images
    const analysis = await toolAnalyzeProduct(product.id)
    // Fire enrichment async without blocking the approve flow
    enrichProductWithAI(product.id, title, niche || 'general').catch(() => {})

    return {
      success: true,
      data: {
        message: `✅ "${title}" imported from CJ Dropshipping and analyzed.`,
        productId: product.id,
        cjProductId,
        cjVariantId: variantId,
        supplierPrice: `$${supplierPrice.toFixed(2)}`,
        retailPrice: `$${retailPrice.toFixed(2)}`,
        image,
        analysis: analysis.data,
        nextStep: `Product is pending approval. Reply "approve ${product.id}" to go live or "reject ${product.id} [reason]" to discard.`
      }
    }
  } catch (err: any) {
    return { success: false, error: `CJ import failed: ${err.message}` }
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

        // Pick the best image: prefer jpg/webp, avoid SVG/GIF, pick highest res available
        const validImage = images.find(img =>
          img.imageUrl &&
          !img.imageUrl.endsWith('.svg') &&
          !img.imageUrl.endsWith('.gif') &&
          (img.imageUrl.startsWith('https://') || img.imageUrl.startsWith('http://'))
        )

        if (validImage?.imageUrl) {
          bestImage = validImage.imageUrl
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
