import { GET as getCatalog } from '../tiktok-catalog/route'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return getCatalog(req)
}
