import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const target = (body.target || 'vexsen').replace(/^@/, '')
    const count  = Math.min(parseInt(body.count || '0', 10), 10) // max 10 accounts per wave
    const wave   = body.wave === true

    const scriptPath = path.join(process.cwd(), 'scripts', 'tiktok_engagement_bot.py')

    // Build args
    const args: string[] = ['--target', target]
    if (count > 0) args.push('--count', String(count))
    if (wave || count === 0) args.push('--wave')

    const cmd = `python "${scriptPath}" ${args.join(' ')}`

    return new Promise((resolve) => {
      exec(cmd, { timeout: 600_000 }, (err, stdout, stderr) => {
        if (err && !stdout) {
          resolve(NextResponse.json({ error: stderr || err.message }, { status: 500 }))
          return
        }

        const created  = (stdout.match(/Created account \d+\/\d+/g) || []).length
        const engaged  = (stdout.match(/Engagement wave done/g) || []).length
        const accounts = (stdout.match(/✅ Account created/g) || []).length

        resolve(NextResponse.json({
          success: true,
          target,
          accountsCreated: accounts || count,
          waveComplete: wave || count === 0,
          message: count > 0
            ? `Created ${accounts} account(s) and engaged @${target}`
            : `Engagement wave complete on @${target}`,
          output: stdout.slice(-1000),
        }))
      })
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
