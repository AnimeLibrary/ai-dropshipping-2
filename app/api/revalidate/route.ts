import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function GET() {
  // Nuke everything so Next.js pulls fresh pages and data
  revalidatePath('/', 'layout')
  return NextResponse.json({ revalidated: true, now: Date.now() })
}
