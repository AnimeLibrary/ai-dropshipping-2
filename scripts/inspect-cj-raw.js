/**
 * DEEP PRODUCT FIX SCRIPT
 * 
 * 1. Fetches the real CJ page for each product PID to get actual product data
 * 2. Fixes the Lip Oil variant labels (Set1-4 are actually multi-packs, Shade 01-08 are individual)
 * 3. Finds replacement for the dead PHOFAY Lip Tint PID
 * 4. Updates all images to the real CJ product images
 * 5. Fixes variant display order and labeling
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Load .env
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
}

const prisma = new PrismaClient()
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

let _token = null
let _tokenExpiry = 0
let _lastReq = 0

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token
  const r = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: process.env.CJ_API_KEY })
  })
  const d = await r.json()
  if (!d.data?.accessToken) throw new Error('CJ auth failed: ' + JSON.stringify(d))
  _token = d.data.accessToken
  _tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
  return _token
}

async function cjGet(path) {
  const now = Date.now()
  const wait = 1100 - (now - _lastReq)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  _lastReq = Date.now()
  const token = await getToken()
  const res = await fetch(`${CJ_BASE}${path}`, { headers: { 'CJ-Access-Token': token } })
  return res.json().catch(() => null)
}

async function main() {
  console.log('\n═══════════════════════════════════════════')
  console.log('  DEEP PRODUCT FIX + IMAGE REFRESH')
  console.log('═══════════════════════════════════════════\n')

  // ── 1. PHOFAY LIP OIL — Fix variant labels ────────────────────
  console.log('📦 Fetching PHOFAY Juicy Lip Oil from CJ...')
  const lipOilData = await cjGet('/product/query?pid=1791643240295305216')
  if (lipOilData?.data) {
    const p = lipOilData.data
    console.log('\nCJ RAW VARIANTS for Lip Oil:')
    const rawVariants = p.variants || p.productVariants || []
    rawVariants.forEach((v, i) => {
      console.log(`  [${i+1}] variantKey: "${v.variantKey}" | variantNameEn: "${v.variantNameEn}" | variantProperty: "${v.variantProperty}"`)
      console.log(`       vid: ${v.vid} | price: $${v.variantSellPrice || v.sellPrice} | stock: ${v.variantStock ?? v.productStock}`)
      console.log(`       image: ${v.variantImage ? v.variantImage.substring(0, 80) + '...' : 'none'}`)
    })

    // Pull all images
    const allImages = []
    const addImg = (val) => {
      if (!val) return
      if (Array.isArray(val)) { val.forEach(addImg); return }
      if (typeof val !== 'string') return
      const t = val.trim()
      if (t.startsWith('[')) { try { const arr = JSON.parse(t); if (Array.isArray(arr)) { arr.forEach(addImg); return } } catch {} }
      if (t.includes(',')) { t.split(',').forEach(addImg); return }
      if ((t.startsWith('http://') || t.startsWith('https://')) && !allImages.includes(t)) allImages.push(t)
    }
    addImg(p.productImageSet); addImg(p.productImage); addImg(p.productImages); addImg(p.bigImage); addImg(p.imageList)
    rawVariants.forEach(v => addImg(v?.variantImage))
    console.log(`\n  Total unique images: ${allImages.length}`)
    allImages.forEach((img, i) => console.log(`  [${i+1}] ${img}`))
  }

  // ── 2. BLUSH DUO — Show raw variant data ───────────────────────
  console.log('\n\n📦 Fetching PHOFAY Blush Duo from CJ...')
  const blushData = await cjGet('/product/query?pid=1795261101102342144')
  if (blushData?.data) {
    const p = blushData.data
    console.log('\nCJ RAW VARIANTS for Blush Duo:')
    const rawVariants = p.variants || p.productVariants || []
    rawVariants.forEach((v, i) => {
      console.log(`  [${i+1}] variantKey: "${v.variantKey}" | variantProperty: "${v.variantProperty?.substring(0,100)}"`)
      console.log(`       vid: ${v.vid} | price: $${v.variantSellPrice || v.sellPrice} | stock: ${v.variantStock ?? v.productStock}`)
      console.log(`       image: ${v.variantImage ? v.variantImage.substring(0, 80) + '...' : 'none'}`)
    })
    const allImages = []
    const addImg = (val) => {
      if (!val) return
      if (Array.isArray(val)) { val.forEach(addImg); return }
      if (typeof val !== 'string') return
      const t = val.trim()
      if (t.startsWith('[')) { try { const arr = JSON.parse(t); if (Array.isArray(arr)) { arr.forEach(addImg); return } } catch {} }
      if (t.includes(',')) { t.split(',').forEach(addImg); return }
      if ((t.startsWith('http://') || t.startsWith('https://')) && !allImages.includes(t)) allImages.push(t)
    }
    addImg(p.productImageSet); addImg(p.productImage); addImg(p.productImages); addImg(p.bigImage); addImg(p.imageList)
    rawVariants.forEach(v => addImg(v?.variantImage))
    console.log(`\n  Total unique images: ${allImages.length}`)
    allImages.slice(0, 5).forEach((img, i) => console.log(`  [${i+1}] ${img}`))
  }

  // ── 3. LIP STAIN — Show raw variant data ──────────────────────
  console.log('\n\n📦 Fetching Lip Stain from CJ...')
  const stainData = await cjGet('/product/query?pid=2410220715201611900')
  if (stainData?.data) {
    const p = stainData.data
    console.log('\nCJ RAW VARIANTS for Lip Stain:')
    const rawVariants = p.variants || p.productVariants || []
    rawVariants.forEach((v, i) => {
      console.log(`  [${i+1}] variantKey: "${v.variantKey}" | variantProperty: "${v.variantProperty}"`)
      console.log(`       vid: ${v.vid} | price: $${v.variantSellPrice || v.sellPrice} | stock: ${v.variantStock ?? v.productStock}`)
      console.log(`       image: ${v.variantImage ? v.variantImage.substring(0, 80) + '...' : 'none'}`)
    })
    const allImages = []
    const addImg = (val) => {
      if (!val) return
      if (Array.isArray(val)) { val.forEach(addImg); return }
      if (typeof val !== 'string') return
      const t = val.trim()
      if (t.startsWith('[')) { try { const arr = JSON.parse(t); if (Array.isArray(arr)) { arr.forEach(addImg); return } } catch {} }
      if (t.includes(',')) { t.split(',').forEach(addImg); return }
      if ((t.startsWith('http://') || t.startsWith('https://')) && !allImages.includes(t)) allImages.push(t)
    }
    addImg(p.productImageSet); addImg(p.productImage); addImg(p.productImages); addImg(p.bigImage); addImg(p.imageList)
    rawVariants.forEach(v => addImg(v?.variantImage))
    console.log(`\n  Total unique images: ${allImages.length}`)
    allImages.forEach((img, i) => console.log(`  [${i+1}] ${img}`))
  }

  // ── 4. SEARCH for replacement Lip Tint ─────────────────────────
  console.log('\n\n🔍 Searching for PHOFAY Lip Tint replacement...')
  // Try specific known PIDs for PHOFAY lip products
  const searchData = await cjGet('/product/list?pageNum=1&pageSize=10&productNameEn=PHOFAY+lip+tint&sortField=salesVolume&sortOrder=DESC')
  if (searchData?.data?.list) {
    console.log(`Found ${searchData.data.list.length} results:`)
    searchData.data.list.forEach((p, i) => {
      console.log(`  [${i+1}] "${p.productNameEn}" | pid: ${p.pid} | price: $${p.sellPrice}`)
    })
  }

  // Also try just "lip tint" from same supplier
  const searchData2 = await cjGet('/product/list?pageNum=1&pageSize=10&productNameEn=lip+tint+oil&sortField=salesVolume&sortOrder=DESC')
  if (searchData2?.data?.list) {
    console.log(`\nAlso found ${searchData2.data.list.length} results for "lip tint oil":`)
    searchData2.data.list.forEach((p, i) => {
      console.log(`  [${i+1}] "${p.productNameEn}" | pid: ${p.pid} | price: $${p.sellPrice} | sales: ${p.salesVolume}`)
    })
  }

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
