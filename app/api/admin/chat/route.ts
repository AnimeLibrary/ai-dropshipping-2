import { NextRequest, NextResponse } from 'next/server'

// Point to the local LM Studio server
const LM_STUDIO_URL = 'http://127.0.0.1:1234/v1/chat/completions'

import { WORKFLOW_SYSTEM_PROMPT } from '@/lib/ai/workflow-context'

export async function POST(req: NextRequest) {
  try {
    const { messages, contextProduct } = await req.json()

    // System instruction enriched with Master Strategist workflow
    const systemInstruction = `
      ${WORKFLOW_SYSTEM_PROMPT}
      
      You are currently analyzing: ${contextProduct ? JSON.stringify(contextProduct) : 'General Store Strategy'}.
      
      When evaluating products, specifically mention the "AI Pricing Rules" (3x profit or $20 min margin).
      Always align with the "Pain -> Solution" storytelling model.
    `

    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[AI CHAT] LM Studio Error:', errorData)
      return NextResponse.json({ error: 'AI Server is not responding. Ensure LM Studio is running on port 1234.' }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json({ 
      message: data.choices[0].message.content,
      usage: data.usage 
    })

  } catch (error: any) {
    console.error('[AI CHAT] Proxy Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
