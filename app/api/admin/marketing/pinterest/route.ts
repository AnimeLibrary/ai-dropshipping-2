import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'pinterest_pin_generator.py')
  return new Promise((resolve) => {
    exec(`python "${scriptPath}"`, { timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) {
        resolve(NextResponse.json({ error: stderr || err.message }, { status: 500 }))
        return
      }
      const countMatch = stdout.match(/(\d+) pin/i)
      resolve(NextResponse.json({
        success: true,
        count: countMatch ? parseInt(countMatch[1]) : 4,
        message: 'Pinterest pins generated',
        output: stdout.slice(-600),
      }))
    })
  })
}
