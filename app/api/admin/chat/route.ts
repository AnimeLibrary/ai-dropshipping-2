import { NextRequest, NextResponse } from 'next/server'
import { WORKFLOW_SYSTEM_PROMPT } from '@/lib/ai/workflow-context'
import { AGENT_TOOLS, executeTool } from '@/lib/ai/agent-tools'
import { prisma } from '@/lib/db/prisma'
import os from 'os'

// ============================================================
// AGENTIC CHAT ENDPOINT — REACT EXECUTION LOOP
// Llama 3.1 8B calls real tools (CSV import, DB writes, approvals)
// in an iterative loop until the task is complete.
// ============================================================

/**
 * Auto-detects the LM Studio host IP.
 * Priority: env var → any active local network IP → localhost
 * This fixes hotspot IP changes without touching .env every time.
 */
function getAIBaseUrl(): string {
  if (process.env.AI_API_ENDPOINT) {
    return process.env.AI_API_ENDPOINT.replace(/\/$/, '')
  }
  // Auto-detect active non-loopback IPv4 address (hotspot / WiFi)
  const nets = os.networkInterfaces()
  for (const iface of Object.values(nets)) {
    for (const addr of iface || []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return `http://${addr.address}:1234`
      }
    }
  }
  return 'http://localhost:1234'
}

const AI_BASE_URL = getAIBaseUrl()
const AI_MODEL = process.env.AI_MODEL_NAME || 'meta-llama-3.1-8b-instruct'

const MAX_ITERATIONS = 8

const AGENT_SYSTEM_PROMPT = `
${WORKFLOW_SYSTEM_PROMPT}

## WHO YOU ARE

You are Vexsen — the AI Operations Director for a dropshipping business. You're smart, helpful, and direct. You can hold normal conversations, answer questions, give advice, brainstorm ideas, and also manage the entire store database.

## YOUR PERSONALITY

- Be natural and conversational — you're a business partner, not a robot
- Keep responses clear and concise
- Use emojis sparingly when it fits
- If the user just wants to chat, talk, or ask questions — do that. Not everything is a command.
- If you don't know something, say so honestly

## YOUR CAPABILITIES (USE TOOLS WHEN RELEVANT)

### Product Sourcing (CJ Dropshipping)
- User asks to find/search products → Call \`search_cj_products\` with relevant keywords
- User picks a product from results → Call \`import_cj_product\` to add it to the store
- User asks about shipping → Call \`get_cj_shipping\`

### Data Import
- CSV data pasted → Call \`import_csv_data\` immediately
- URL posted → Call \`scrape_url\` to read the page, then act on what you find
- Raw product text pasted → Call \`add_product_manual\`

### Product Management
- After any product is created/imported → Call \`analyze_product\` on it
- User says "approve [id]" → Call \`approve_product\`
- User says "reject [id] [reason]" → Call \`reject_product\`
- User asks about pending products → Call \`list_pending_products\`
- User asks about store stats/status → Call \`get_store_metrics\`

### After Analysis, Present This Report:

## PRODUCT INTEL REPORT
**Product:** [title] | **ID:** [id] | **Source:** [source]

### Pricing
- Supplier Cost → Retail Price → Net Profit (margin%)

### CJ Dropshipping
- Product linked: yes/no
- Auto-fulfillment ready: yes/no

### AI VERDICT: APPROVE or REVIEW
[one sentence reasoning]

> Reply: **approve [id]** or **reject [id] [reason]**

## RULES & FATAL ERRORS TO AVOID
- **CRITICAL**: NEVER tell the user to "call a tool" or use a command (e.g. do NOT say "You need to call search_cj_products"). The user cannot execute tools. YOU must execute the tools automatically behind the scenes. If the user says "find me top 10 products", YOU trigger the search_cj_products tool immediately.
- **CRITICAL**: If you return results from a search, ask the user which one they like. Once they reply, YOU trigger the \`import_cj_product\` tool. Do not ask them to type a command.
- When the user mentions product ideas, niches, or categories — proactively use your tools to search CJ.
- Always include CJ Product ID and Variant ID in reports.
- If CJ API is not configured, inform the user to add it to their .env file.
- Be autonomous. Do the heavy lifting for the user.
`

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: any[]
  name?: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: ChatMessage[] }

    // Remove the initial UI welcome message from history to prevent LM Studio Jinja template crashes 
    let filteredMessages = messages
      .filter(m => !(m.role === 'assistant' && m.content.includes('Vexsen AI Agent — Online')))
      .slice(-6)

    // LM Studio Llama 3 formatting STRICTLY requires the first non-system message to be from a 'user'
    while (filteredMessages.length > 0 && filteredMessages[0].role !== 'user') {
      filteredMessages.shift()
    }

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      ...filteredMessages
    ]

    // ─── PRE-PROCESS: URL DETECTION & SERVER-SIDE SCRAPE ───────
    const lastUserMsg = filteredMessages.filter(m => m.role === 'user').at(-1)
    if (lastUserMsg) {
      const urlMatch = lastUserMsg.content.trim().match(/https?:\/\/[^\s]+/)

      if (urlMatch) {
        const url = urlMatch[0]
        const isKalodata = url.includes('kalodata.com')
        const isTikTok = url.includes('tiktok.com')
        const isAliExpress = url.includes('aliexpress.com')
        const isCJ = url.includes('cjdropshipping.com')

        let scrapedContext = ''

        if (isKalodata) {
          // Kalodata is Cloudflare-protected — no scraper can access it.
          // Guide the AI to instruct the user on the CSV export instead.
          scrapedContext = `
[AUTO-SYSTEM — KALODATA URL DETECTED]
Kalodata blocks all automated scraping with Cloudflare protection. The URL cannot be scraped automatically.
Instead, provide the user with these exact steps to get the data:
1. On the Kalodata product page they linked, click the "Export" button (top right)
2. Download the CSV file
3. Paste the CSV contents directly into this chat
4. You will then import and analyze it automatically

Also tell them: for TikTok product research without accounts or paid tools, they can use:
- TikTok Creative Center (ads.tiktok.com/business/creativecenter/inspiration/topads) — official free tool
- AliExpress Dropshipping Center — free sales volume data
`
        } else if (isTikTok || isAliExpress || isCJ) {
          // Attempt real fetch for non-Cloudflare sites
          try {
            const res = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
              },
              signal: AbortSignal.timeout(10000)
            })
            const html = await res.text()
            // Strip HTML tags and excess whitespace
            const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000)
            scrapedContext = `[AUTO-SYSTEM — PAGE SCRAPED]\nURL: ${url}\nContent excerpt:\n${text}\n\nAnalyze this product data and create a full PRODUCT INTEL REPORT.`
          } catch {
            scrapedContext = `[AUTO-SYSTEM — SCRAPE FAILED]\nURL: ${url}\nThe page could not be fetched. Ask the user to copy-paste the product details manually.`
          }
        } else {
          // Generic URL — attempt fetch
          try {
            const res = await fetch(url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              signal: AbortSignal.timeout(8000)
            })
            const html = await res.text()
            const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 2000)
            scrapedContext = `[AUTO-SYSTEM — PAGE SCRAPED]\nURL: ${url}\nContent:\n${text}\n\nAnalyze any product data found and create a PRODUCT INTEL REPORT.`
          } catch {
            scrapedContext = `[AUTO-SYSTEM — SCRAPE FAILED for ${url}]\nAsk the user to paste the product data manually.`
          }
        }

        // Inject scraped context into the message so LM Studio gets real data
        lastUserMsg.content = `${lastUserMsg.content}\n\n${scrapedContext}`

      } else if (lastUserMsg.content.includes(',') && lastUserMsg.content.split('\n').length > 3) {
        // CSV paste detected
        lastUserMsg.content = `${lastUserMsg.content}\n\n[AUTO-SYSTEM]: CSV data detected. Immediately call \`import_csv_data\` with this data. Do not ask for confirmation.`
      } else if (
        lastUserMsg.content.toLowerCase().match(/(cj|cjdropshipping).*(search|find|top|best|pull up|show me)/) || 
        lastUserMsg.content.toLowerCase().match(/(search|find|top|best|pull up|show me).*(cj|cjdropshipping)/) ||
        // also catch general product searches without explicit "CJ" label
        lastUserMsg.content.toLowerCase().match(/(search|find|top|best|popping|selling).*(products|goods|items)/)
      ) {
        // Automatically intercept CJ search queries so the 8B LLM doesn't have to figure out the tool call
        try {
          const { cj } = await import('@/lib/services/cj-service')
          
          if (!process.env.CJ_EMAIL) {
            console.warn("Next.js ENV cache issue: CJ_EMAIL is missing at runtime.")
          }
          
          if (!cj.isConfigured()) {
            lastUserMsg.content = `${lastUserMsg.content}\n\n[AUTO-SYSTEM]: Tell the user the CJ API isn't connected yet. Ask them to restart their dev server.`
          } else {
            // Extract a possible keyword, fallback to "bestseller" if none is obvious
            const parts = lastUserMsg.content.replace(/cj|cjdropshipping|search|find|top|best|pull up|show me|products?/gi, '').trim()
            const keyword = parts.length > 2 ? parts : 'bestseller'
            
            const results = await cj.searchProduct(keyword)
            const limited = results.slice(0, 5)
            const formatted = limited.map((p: any, i: number) => 
              `[${i+1}] Title: ${p.productNameEn || p.productName || 'Unknown'} - Price: $${Number(p.sellPrice || 0).toFixed(2)} - CJ_ID: ${p.pid}`
            ).join('\n')
            
            lastUserMsg.content = `User asked for products: "${lastUserMsg.content}".\n\n[AUTO-SYSTEM FETCH SUCCESS]: I automatically searched the real-time CJ Dropshipping API for "${keyword}". Here are the top results:\n${formatted}\n\nTask: Present these products nicely to the user. Then ask them if they want you to import any of them. DO NOT tell the user to run a tool.`
          }
        } catch (e: any) {
          lastUserMsg.content = `${lastUserMsg.content}\n\n[AUTO-SYSTEM ERROR]: CJ Search failed: ${e.message}`
        }
      } else if (lastUserMsg.content.toLowerCase().match(/(import|approve)/)) {
        // Intercept import/approve requests to bypass the LLM entirely
        const idsToImport = []
        // See if user specified a specific number
        const idMatch = lastUserMsg.content.match(/\d{10,}/g)
        if (idMatch) {
          idsToImport.push(...idMatch)
        } else {
          // Look backwards in history for CJ_ID: numbers reported by the system
          for (let i = filteredMessages.length - 1; i >= 0; i--) {
            const histMatches = filteredMessages[i].content.match(/CJ_ID:\s*(\d{10,})/g)
            if (histMatches) {
              histMatches.forEach(m => idsToImport.push(m.replace(/CJ_ID:\s*/, '')))
              break // just grab from the most recent list
            }
          }
        }
        
        if (idsToImport.length > 0) {
          try {
            const { cj } = await import('@/lib/services/cj-service')
            let results = []
            // Just import the first 2 safely to avoid taking forever if grabbing a huge list
            for (const cjId of idsToImport.slice(0, 2)) {
               const imported = await cj.importProduct(cjId, 'general')
               if (imported) {
                 const rawPrice = String(imported.sellPrice || 10)
                 const parsedPrice = parseFloat(rawPrice.split('-')[0])
                 const finalPrice = isNaN(parsedPrice) ? 10 : parsedPrice
                 
                 await prisma.product.create({
                   data: {
                     title: imported.productNameEn || 'CJ Dropshipping Product',
                     price: finalPrice * 2.5, // Quick retail markup default for intercept
                     supplierCost: finalPrice,
                     status: 'pending',
                     margin: 0,
                     profit: 0,
                     originalUrl: `https://cjdropshipping.com/product/${cjId}`,
                     sourceStore: 'CJ Dropshipping',
                     cjProductId: cjId,
                     cjVariantId: imported.variantId || null
                   }
                 })
                 results.push(`Success - ID: ${cjId}`)
               }
            }
            lastUserMsg.content = `User asked to import products.\n\n[AUTO-SYSTEM IMPORT SUCCESS]: I automatically imported these items directly to the database: ${results.join(', ')}.\n\nTell the user: "I bypassed the standard tools and directly imported those products! You can view them right now at http://localhost:3000/admin"`
          } catch (e: any) {
            lastUserMsg.content = `User asked to import products.\n\n[AUTO-SYSTEM ERROR]: Failed to import: ${e.message}`
          }
        } else {
          lastUserMsg.content = `${lastUserMsg.content}\n\n[CRITICAL SYSTEM INSTRUCTION]: The user wants to import something, but no specific CJ IDs were found in the history. Ask them to provide the exact IDs they want to import.`
        }
      } else if (lastUserMsg.content.length > 80 && !lastUserMsg.content.toLowerCase().match(/^(what|how|why|can|do|is|are|show)/)) {
        // Raw product text paste
        lastUserMsg.content = `${lastUserMsg.content}\n\n[AUTO-SYSTEM]: Raw product data detected. Extract title/price and call \`add_product_manual\` immediately.`
      } else {
        // Generic conversational message
        lastUserMsg.content = `${lastUserMsg.content}\n\n[CRITICAL SYSTEM INSTRUCTION]: If this request requires searching, importing, or data retrieval, YOU MUST CALL THE RELEVANT TOOL YOURSELF NOW. Do NOT generate a text response telling the user to call the tool.`
      }

      await prisma.systemLog.create({
        data: { level: 'info', source: 'agent:chat', message: `User: ${lastUserMsg.content.slice(0, 200)}` }
      })
    }

    let iterations = 0
    let finalResponse: string | null = null

    // ─── REACT LOOP ─────────────────────────────────────────
    while (iterations < MAX_ITERATIONS) {
      iterations++

      const llmRes = await fetch(`${AI_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: fullMessages,
          tools: AGENT_TOOLS,
          tool_choice: 'auto',
          temperature: 0.3,
          stream: false,
        }),
        signal: AbortSignal.timeout(60000)
      })

      if (!llmRes.ok) {
        const err = await llmRes.json().catch(() => ({}))
        const errMsg = err?.error || err?.message || `HTTP ${llmRes.status} from LM Studio.`
        await prisma.systemLog.create({
          data: { level: 'error', source: 'agent:llm', message: `LM Studio error ${llmRes.status}`, meta: JSON.stringify(err) }
        })
        return NextResponse.json(
          { error: `LM Studio API rejected the prompt: ${errMsg}` },
          { status: llmRes.status }
        )
      }

      const llmData = await llmRes.json()
      const choice = llmData.choices?.[0]

      if (!choice) {
        return NextResponse.json({ error: 'No response from AI model' }, { status: 502 })
      }

      const assistantMsg: ChatMessage = choice.message
      fullMessages.push(assistantMsg)

      // No tool calls = final answer
      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        finalResponse = assistantMsg.content
        break
      }

      // Execute every tool call in this turn
      for (const toolCall of assistantMsg.tool_calls) {
        let args: Record<string, any> = {}
        try { args = JSON.parse(toolCall.function.arguments) } catch { }

        console.log(`[Agent] Tool: ${toolCall.function.name}`, Object.keys(args))
        const result = await executeTool(toolCall.function.name, args)

        fullMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result.success ? result.data : { error: result.error })
        })
      }
    }

    if (!finalResponse) {
      finalResponse = 'Operations complete. Check the dashboard for updated results.'
    }

    // Log AI response
    await prisma.systemLog.create({
      data: { level: 'info', source: 'agent:response', message: finalResponse.slice(0, 300), meta: JSON.stringify({ iterations }) }
    })

    return NextResponse.json({ message: finalResponse, iterations })

  } catch (error: any) {
    console.error('[Agent] Fatal:', error)
    await prisma.systemLog.create({
      data: { level: 'error', source: 'agent:chat', message: error.message }
    }).catch(() => { })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
