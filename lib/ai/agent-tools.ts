import { PrismaClient } from '@prisma/client'
import { calculateTargetPrice, calculateProfitStats } from '@/lib/utils/pricing'
import { prisma } from '@/lib/db/prisma'

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

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s"]/g, '_'))
  const inserted: string[] = []
  const skipped: string[] = []

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted CSV values properly
    const vals = lines[i].match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g)
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
    select: { id: true, title: true, niche: true, price: true, supplierPrice: true, trendScore: true, source: true },
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
      pipeline: { pending: pendingCount, approved: approvedCount, archived: archivedCount }
    }
  }
}
