import { POST as createSessionPOST } from './create-session/route'

// Delegate /api/checkout directly to the unified create-session route
// Ensures single source of truth for pricing, quantity breaks, referral codes, and CJ variant IDs
export async function POST(req: Request) {
  return createSessionPOST(req)
}
