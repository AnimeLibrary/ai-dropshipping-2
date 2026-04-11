import { NextRequest, NextResponse } from 'next/server'
import { WORKFLOW_SYSTEM_PROMPT } from '@/lib/ai/workflow-context'
import { AGENT_TOOLS, executeTool } from '@/lib/ai/agent-tools'
import { prisma } from '@/lib/db/prisma'

// ============================================================
// AGENTIC CHAT ENDPOINT — REACT EXECUTION LOOP
// Llama 3.1 8B calls real tools (CSV import, DB writes, approvals)
// in an iterative loop until the task is complete.
// ============================================================

const AI_BASE_URL = (() => {
  const envUrl = process.env.AI_API_ENDPOINT || 'http://172.20.10.11:1234'
  return envUrl.replace(/\/$/, '')
})()
const AI_MODEL = process.env.AI_MODEL_NAME || 'meta-llama-3.1-8b-instruct'

const MAX_ITERATIONS = 8

const AGENT_SYSTEM_PROMPT = `
${WORKFLOW_SYSTEM_PROMPT}

## YOUR AUTHORITY

You are the Vexsen AI Operations Director. You have DIRECT database access via tools and must use them proactively — not just talk about it.

### MANDATORY BEHAVIOR:

1. **CSV DATA DETECTED** → Immediately call \`import_csv_data\`. Do not ask. Do not summarize. Call the tool.
2. **AFTER IMPORT** → Call \`analyze_product\` on EVERY product ID returned. Do not skip any.
3. **AFTER EACH ANALYSIS** → Present a formatted approval request:

## PRODUCT INTEL REPORT
**Product:** [title]
**ID:** [id]
**Source:** [source]

### Pricing
- Supplier Cost: [cost]
- Retail Price: [retail]
- Net Profit: [profit] ([margin]%)
- Margin Rating: [rating]

### Market Saturation
- Score: [score]/100
- Assessment: [label]
- Strategy: [recommendation]

### Supplier Intel
[supplier details or warning]

### AI VERDICT: [APPROVE / REVIEW]
[reasoning]

> Reply: **approve [id]** or **reject [id] [reason]**

4. **"approve [id]"** → Call \`approve_product\` immediately.
5. **"reject [id] reason"** → Call \`reject_product\` immediately.
6. **"store status"** → Call \`get_store_metrics\`.
7. **"pending"** → Call \`list_pending_products\`.

Be fast. Be precise. No filler.
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

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      ...messages
    ]

    // Log incoming user message
    const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)
    if (lastUserMsg) {
      await prisma.systemLog.create({
        data: { level: 'info', source: 'agent:chat', message: `User: ${lastUserMsg.content.slice(0, 200)}` }
      })
    }

    let iterations = 0
    let finalResponse: string | null = null

    // ─── REACT LOOP ─────────────────────────────────────────
    while (iterations < MAX_ITERATIONS) {
      iterations++

      const llmRes = await fetch(`${AI_BASE_URL}/api/v1/chat`, {
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
        await prisma.systemLog.create({
          data: { level: 'error', source: 'agent:llm', message: `LM Studio error ${llmRes.status}`, meta: JSON.stringify(err) }
        })
        return NextResponse.json(
          { error: `AI agent offline. Ensure LM Studio is running at ${AI_BASE_URL}` },
          { status: 502 }
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
