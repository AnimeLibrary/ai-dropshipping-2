import { NextRequest, NextResponse } from 'next/server'

// Canned high-quality support responses — no LLM dependency needed for common queries
const CANNED: Array<{ patterns: string[]; reply: string; escalate?: boolean }> = [
  {
    patterns: ['order', 'tracking', 'where is', 'shipment', 'shipped', 'shipping status', 'package'],
    reply: `Great question! Here's how tracking works at Vexsen:\n\n**Step 1** — Your order enters our fulfillment queue immediately after purchase.\n**Step 2** — We process and hand off to our carrier within **24–72 hours**.\n**Step 3** — You receive a tracking number via email the moment your package leaves our facility.\n\nIf you haven't received a tracking email after 72 hours, paste your order confirmation number below and I'll look into it personally. 🔍`,
  },
  {
    patterns: ['return', 'refund', 'money back', 'exchange', 'not happy', 'disappointed', 'broken', 'defective'],
    reply: `We've got you covered with a **two-tier guarantee**:\n\n🛡️ **Defective or missing item?** Full refund — no questions, no restocking fee, no hassle.\n\n💳 **Changed your mind?** Store credit equal to 100% of your purchase price — so your money never goes to waste.\n\nTo start a return, email us at **support@vexsen.store** with your order number. We respond within 4 hours during business hours.\n\n[View our full refund policy →](/policies/refund)`,
  },
  {
    patterns: ['secure', 'safe', 'payment', 'card', 'stripe', 'checkout', 'scam', 'trust', 'legit'],
    reply: `100% secure — here's exactly how:\n\n🔒 **Stripe Checkout** — PCI-DSS Level 1 certified. Your card details never touch our servers.\n\n🔐 **SSL encrypted** — All connections are secured end-to-end.\n\n✅ **No stored payment data** — We never save card numbers. Ever.\n\nStripe is the same payment processor used by Amazon, Shopify, and Apple. You're in safe hands.`,
  },
  {
    patterns: ['international', 'ship outside', 'uk', 'canada', 'australia', 'europe', 'worldwide', 'global'],
    reply: `Currently we ship to all **50 US states**. 🇺🇸\n\nInternational shipping is actively being rolled out — **UK, Canada, and Australia** are next on the list.\n\nWant to be notified the moment we ship to your country? Drop your email below and you'll be first to know! 📬`,
    escalate: true,
  },
  {
    patterns: ['cancel', 'cancellation', 'stop order'],
    reply: `We process orders fast — so **cancellations must be requested within 1 hour of purchase**.\n\nEmail **support@vexsen.store** immediately with your order number and "CANCEL" in the subject line. If it hasn't shipped yet, we'll stop it.\n\nIf it's already shipped — no worries, our return policy covers you fully.`,
  },
  {
    patterns: ['discount', 'coupon', 'promo', 'code', 'deal', 'sale', 'cheaper'],
    reply: `A few ways to save at Vexsen:\n\n🎁 **Referral codes** — share your link and you both save 15%\n📧 **Email list** — subscribers get early access to flash sales\n📦 **Bundles** — our [Triple-Threat Bundles](/bundles) are always 25–40% cheaper than buying individually\n\nAnything specific you're looking for? I can check if there's a deal running right now.`,
  },
  {
    patterns: ['bundle', 'combo', 'deal', 'together', 'set'],
    reply: `Yes! Our bundles are handpicked by AI every week based on what products solve the same root problem together.\n\nYou can browse current bundles here → [/bundles](/bundles)\n\nBundle customers typically save **25–40%** vs buying items individually, and they ship together in one box. 📦`,
  },
  {
    patterns: ['hi', 'hello', 'hey', 'hiya', 'sup', 'yo', 'good morning', 'good afternoon'],
    reply: `Hey! 👋 Great to hear from you.\n\nI'm here and ready to help. What can I do for you today?\n\nCommon things I can help with:\n- 📦 Order tracking\n- ↩️ Returns & refunds\n- 🔒 Checkout & security\n- 💰 Discounts & bundles`,
  },
  {
    patterns: ['human', 'real person', 'agent', 'someone', 'staff', 'manager', 'call', 'phone', 'speak'],
    reply: `Absolutely — a real person has your back. 🙋\n\nLeave your email below and our team will reach out within **4 hours** (usually much faster during business hours). We read and respond to every message personally.`,
    escalate: true,
  },
]

const FALLBACK = `That's a great question — I want to make sure I give you the right answer rather than a guess.\n\nCould you share your **order number** or a bit more detail about what you're experiencing? Or if it's urgent, drop your email below and one of our team members will follow up directly within 4 hours. 🙏`

function matchReply(message: string): { reply: string; escalate: boolean } {
  const lower = message.toLowerCase()

  for (const entry of CANNED) {
    if (entry.patterns.some((p) => lower.includes(p))) {
      return { reply: entry.reply, escalate: !!entry.escalate }
    }
  }

  // Try to detect frustration / urgency as escalation triggers
  const urgencyWords = ['urgent', 'asap', 'immediately', 'help me', 'angry', 'furious', 'worst', 'terrible', 'lawsuit']
  const isUrgent = urgencyWords.some((w) => lower.includes(w))

  return {
    reply: isUrgent
      ? `I can hear that this is urgent and I'm taking it seriously.\n\nPlease leave your email below — a real team member will prioritize your case and respond within **1 hour**. You won't be left hanging.`
      : FALLBACK,
    escalate: isUrgent,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: FALLBACK, escalate: false })
    }

    // Rate limit: simple header check (Vercel edge will handle real rate limiting)
    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    const { reply, escalate } = matchReply(message.trim())

    // Simulate a realistic response delay (200–800ms) for authenticity
    // In production, this would be replaced with an actual AI API call (e.g., Gemini)
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 600 + 200))

    return NextResponse.json({ reply, escalate })
  } catch (err: any) {
    return NextResponse.json({ reply: "Sorry, there was a connection issue. Please email support@vexsen.store and we'll reply within 4 hours.", escalate: false })
  }
}
