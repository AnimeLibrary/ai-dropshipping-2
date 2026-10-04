import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'tiktok_growth_engine.py')
  return new Promise((resolve) => {
    exec(`python "${scriptPath}"`, { timeout: 60_000 }, (err, stdout, stderr) => {
      if (err) {
        resolve(NextResponse.json({ error: stderr || err.message }, { status: 500 }))
        return
      }
      const countMatch = stdout.match(/(\d+) caption/i)
      resolve(NextResponse.json({
        success: true,
        count: countMatch ? parseInt(countMatch[1]) : 20,
        message: 'TikTok captions and 7-day calendar generated',
        output: stdout.slice(-600),
      }))
    })
  })
}
