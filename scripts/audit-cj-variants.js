/**
 * CJ VARIANT AUDIT + REPAIR SCRIPT
 * 
 * 1. Pulls every product from the DB that has a cjProductId
 * 2. Live-fetches real variants from CJ Dropshipping API
 * 3. Shows discrepancies (ghost variants in DB not on CJ, missing variants)
 * 4. Auto-patches: removes ghost variants, adds missing ones, fixes images
 *
 * Usage: node scripts/audit-cj-variants.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Manually load .env without dotenv dependency
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

const prisma = new PrismaClient()

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

let accessToken = null
let tokenExpiry = 0
let lastRequestTime = 0

async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: process.env.CJ_API_KEY })
  })
  const data = await res.json()
  if (!data.data?.accessToken) throw new Error('CJ auth failed: ' + JSON.stringify(data))
  accessToken = data.data.accessToken
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
  console.log('✅ CJ auth token acquired')
  return accessToken
}

async function cjRequest(path) {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < 1100) await new Promise(r => setTimeout(r, 1100 - elapsed))
  lastRequestTime = Date.now()
  const token = await getToken()
  const res = await fetch(`${CJ_BASE}${path}`, {
    headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json' }
  })
  return res.json().catch(() => null)
}

function extractImages(p) {
  const images = []
  const addImg = (val) => {
    if (!val) return
    if (Array.isArray(val)) { val.forEach(addImg); return }
    if (typeof val !== 'string') return
    const t = val.trim()
    if (t.startsWith('[') && t.endsWith(']')) {
      try { const arr = JSON.parse(t); if (Array.isArray(arr)) { arr.forEach(addImg); return } } catch {}
    }
    if (t.includes(',')) { t.split(',').forEach(addImg); return }
    if ((t.startsWith('http://') || t.startsWith('https://')) && !images.includes(t)) images.push(t)
  }
  addImg(p.productImageSet); addImg(p.productImage); addImg(p.productImages)
  addImg(p.bigImage); addImg(p.imageList)
  if (Array.isArray(p.variants || p.productVariants)) {
    ;(p.variants || p.productVariants).forEach(v => addImg(v?.variantImage))
  }
  return images
}

function normalizeVariants(p) {
  const rawPrice = parseFloat(String(p.sellPrice || p.productPrice || 0).split('-')[0]) || 0
  const rawVariants = p.variants || p.productVariants || []
  return rawVariants.map((v, idx) => {
    const props = {}
    const rawProp = v.variantProperty || v.variantProperties || ''
    if (typeof rawProp === 'string' && (rawProp.startsWith('[') || rawProp.startsWith('{'))) {
      try {
        const parsed = JSON.parse(rawProp)
        if (Array.isArray(parsed)) parsed.forEach(item => { if (item?.name && item?.value) props[item.name.toLowerCase().trim()] = String(item.value).trim() })
      } catch {}
    } else if (typeof rawProp === 'string' && rawProp.includes(':')) {
      rawProp.split(';').forEach(part => { const [k, val] = part.split(':'); if (k && val) props[k.trim().toLowerCase()] = val.trim() })
    }
    let color = props['color'] || props['colour'] || null
    let size = props['size'] || props['specification'] || props['spec'] || null
    const key = (v.variantKey || '').trim()
    const nameEn = (v.variantNameEn || v.variantName || '').trim()
    let rawLabel = key || (nameEn.replace(new RegExp(`^${p.productNameEn || ''}`, 'i'), '').trim()) || nameEn
    if (!rawLabel) rawLabel = [color, size].filter(Boolean).join(' / ') || `Option ${idx + 1}`
    let cleanLabel = rawLabel.replace(/^1PCS-/i, '').replace(/^1PCS\s+/i, '').trim()
    if (/^\d+$/.test(cleanLabel)) cleanLabel = `Shade ${cleanLabel}`
    else if (/^Color\s*code\s*(\d+)/i.test(cleanLabel)) cleanLabel = `Shade ${cleanLabel.match(/(\d+)/)?.[1]}`
    if (!color) {
      const known = ['black','white','red','blue','green','pink','purple','brown','bare brown','red brown','cocoa','rose','peach','nude','coral','berry','orange','yellow','grey','gray']
      for (const c of known) if (cleanLabel.toLowerCase().includes(c)) { color = c.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '); break }
    }
    if (!size) { const m = cleanLabel.match(/(\d+\s*(?:ml|g|oz|pcs|pc|set))/i); if (m) size = m[1].toUpperCase() }
    return {
      vid: String(v.vid || v.variantId || ''),
      sku: String(v.variantSku || v.sku || ''),
      label: cleanLabel || 'Default',
      color: color || null,
      size: size || null,
      supplierPrice: parseFloat(String(v.variantSellPrice || v.sellPrice || rawPrice)) || rawPrice,
      stock: Number(v.variantStock ?? v.productStock ?? 0),
      image: v.variantImage || v.image || p.productImage || '',
    }
  })
}

async function auditProduct(product) {
  const data = await cjRequest(`/product/query?pid=${product.cjProductId}`)
  if (!data?.data) {
    console.log(`  ⚠️  CJ returned no data for PID ${product.cjProductId}`)
    return null
  }
  const cjProduct = data.data
  const cjVariants = normalizeVariants(cjProduct)
  const cjImages = extractImages(cjProduct)
  return { cjProduct, cjVariants, cjImages }
}

async function main() {
  console.log('\n════════════════════════════════════════════')
  console.log('   CJ VARIANT AUDIT — LIVE DATABASE CHECK')
  console.log('════════════════════════════════════════════\n')

  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Found ${products.length} total products in database.\n`)

  const noCjPid = products.filter(p => !p.cjProductId)
  const hasCjPid = products.filter(p => p.cjProductId)

  if (noCjPid.length > 0) {
    console.log(`⚠️  ${noCjPid.length} products have NO cjProductId (cannot verify):`)
    noCjPid.forEach(p => console.log(`   - "${p.title}" [${p.id}]`))
    console.log()
  }

  console.log(`🔍 Auditing ${hasCjPid.length} products with CJ PIDs...\n`)

  const report = []

  for (const product of hasCjPid) {
    console.log(`\n── ${product.title}`)
    console.log(`   DB variants: ${product.variants.length}`)
    console.log(`   CJ PID: ${product.cjProductId}`)

    const result = await auditProduct(product)
    if (!result) {
      report.push({ product, status: 'CJ_NO_DATA', cjVariants: [], issues: ['CJ returned no data'] })
      continue
    }

    const { cjVariants, cjImages } = result

    console.log(`   CJ live variants: ${cjVariants.length}`)
    console.log(`   CJ live images: ${cjImages.length}`)

    const issues = []
    const dbVids = new Set(product.variants.map(v => v.vid))
    const cjVids = new Set(cjVariants.map(v => v.vid))

    // Find ghost variants (in DB but NOT on CJ)
    const ghostVids = [...dbVids].filter(vid => !cjVids.has(vid))
    // Find missing variants (on CJ but NOT in DB)
    const missingVids = [...cjVids].filter(vid => !dbVids.has(vid))
    // Variants with no image
    const noImageDb = product.variants.filter(v => !v.image)
    // Variants where CJ now has a better image
    const betterImageAvailable = product.variants.filter(v => {
      const cjV = cjVariants.find(c => c.vid === v.vid)
      return cjV?.image && cjV.image !== v.image
    })

    if (ghostVids.length > 0) {
      issues.push(`${ghostVids.length} GHOST variants in DB (not on CJ): ${ghostVids.join(', ')}`)
      console.log(`   ❌ GHOST variants (in DB but not on CJ): ${ghostVids.length}`)
      ghostVids.forEach(vid => {
        const dbV = product.variants.find(v => v.vid === vid)
        console.log(`      - "${dbV?.label}" (vid: ${vid})`)
      })
    }
    if (missingVids.length > 0) {
      issues.push(`${missingVids.length} MISSING variants from CJ not in DB: ${missingVids.join(', ')}`)
      console.log(`   ➕ MISSING variants (on CJ but not in DB): ${missingVids.length}`)
      missingVids.forEach(vid => {
        const cjV = cjVariants.find(v => v.vid === vid)
        console.log(`      + "${cjV?.label}" (vid: ${vid}, stock: ${cjV?.stock}, price: $${cjV?.supplierPrice})`)
      })
    }
    if (noImageDb.length > 0) {
      issues.push(`${noImageDb.length} variants have no image`)
      console.log(`   🖼️  Variants missing images: ${noImageDb.length}`)
    }
    if (betterImageAvailable.length > 0) {
      issues.push(`${betterImageAvailable.length} variants have updated images on CJ`)
      console.log(`   🔄 Variants with updated CJ images: ${betterImageAvailable.length}`)
    }
    if (product.variants.length > cjVariants.length * 2) {
      issues.push(`DB has ${product.variants.length} variants but CJ only has ${cjVariants.length} — possible inflation`)
      console.log(`   ⚠️  VARIANT COUNT MISMATCH: DB=${product.variants.length}, CJ=${cjVariants.length}`)
    }

    // Print ALL real CJ variants for this product
    console.log(`\n   📋 REAL CJ VARIANTS (what you can actually sell):`)
    cjVariants.forEach((v, i) => {
      const inDb = dbVids.has(v.vid)
      const marker = inDb ? '✅' : '🆕'
      console.log(`      ${marker} [${i+1}] "${v.label}" | vid:${v.vid} | stock:${v.stock} | $${v.supplierPrice} | img:${v.image ? '✓' : '✗'}`)
    })

    if (issues.length === 0) {
      console.log(`   ✅ CLEAN — DB matches CJ exactly`)
    }

    report.push({ product, cjVariants, cjImages, issues, ghostVids, missingVids, betterImageAvailable })
  }

  // ─── SUMMARY ─────────────────────────────────────────────────
  console.log('\n\n════════════════════════════════════════════')
  console.log('   AUDIT SUMMARY')
  console.log('════════════════════════════════════════════')
  let clean = 0, hasIssues = 0
  for (const r of report) {
    if (r.issues.length === 0) { clean++; continue }
    hasIssues++
    console.log(`\n❌ "${r.product.title}"`)
    r.issues.forEach(i => console.log(`   • ${i}`))
  }
  console.log(`\n✅ Clean: ${clean}/${report.length}`)
  console.log(`❌ Needs fix: ${hasIssues}/${report.length}`)

  // ─── AUTO-PATCH ───────────────────────────────────────────────
  console.log('\n\n════════════════════════════════════════════')
  console.log('   AUTO-PATCH: SYNCING TO REAL CJ DATA')
  console.log('════════════════════════════════════════════\n')

  for (const r of report) {
    if (!r.cjVariants || r.cjVariants.length === 0) continue
    const { product, cjVariants, cjImages, ghostVids, missingVids, betterImageAvailable } = r
    let patched = false

    // 1. Delete ghost variants
    if (ghostVids && ghostVids.length > 0) {
      for (const vid of ghostVids) {
        const dbV = product.variants.find(v => v.vid === vid)
        if (dbV) {
          await prisma.productVariant.delete({ where: { id: dbV.id } })
          console.log(`🗑️  "${product.title}" — Deleted ghost variant "${dbV.label}" (vid: ${vid})`)
          patched = true
        }
      }
    }

    // 2. Add missing variants from CJ
    if (missingVids && missingVids.length > 0) {
      for (const vid of missingVids) {
        const cjV = cjVariants.find(v => v.vid === vid)
        if (cjV) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              vid: cjV.vid,
              sku: cjV.sku,
              label: cjV.label,
              color: cjV.color || null,
              size: cjV.size || null,
              supplierPrice: cjV.supplierPrice,
              retailPrice: product.price,
              cjStock: cjV.stock,
              image: cjV.image || (cjImages[0] || product.heroImage || ''),
              isDefault: false,
            }
          })
          console.log(`➕ "${product.title}" — Added CJ variant "${cjV.label}" (vid: ${vid}, stock: ${cjV.stock})`)
          patched = true
        }
      }
    }

    // 3. Update images for all variants (pull fresh from CJ)
    for (const dbV of product.variants) {
      const cjV = cjVariants.find(v => v.vid === dbV.vid)
      if (!cjV) continue
      const freshImage = cjV.image || cjImages[0] || product.heroImage || ''
      if (freshImage && freshImage !== dbV.image) {
        await prisma.productVariant.update({
          where: { id: dbV.id },
          data: { image: freshImage, color: cjV.color || dbV.color, size: cjV.size || dbV.size, label: cjV.label, cjStock: cjV.stock, supplierPrice: cjV.supplierPrice }
        })
        console.log(`🔄 "${product.title}" — Updated variant "${dbV.label}" image + metadata`)
        patched = true
      }
    }

    // 4. Update product heroImage to best available CJ image (first image)
    if (cjImages.length > 0) {
      // heroImage stored as JSON array string for multi-image support
      const heroVal = JSON.stringify(cjImages)
      if (product.heroImage !== heroVal) {
        await prisma.product.update({
          where: { id: product.id },
          data: { heroImage: heroVal, cjLastSyncedAt: new Date() }
        })
        console.log(`🖼️  "${product.title}" — Updated heroImage with ${cjImages.length} CJ images`)
        patched = true
      }
    }

    // 5. Ensure first/only default variant is marked correctly
    const freshVariants = await prisma.productVariant.findMany({ where: { productId: product.id } })
    const hasDefault = freshVariants.some(v => v.isDefault)
    if (!hasDefault && freshVariants.length > 0) {
      await prisma.productVariant.update({ where: { id: freshVariants[0].id }, data: { isDefault: true } })
      console.log(`✅ "${product.title}" — Set default variant to "${freshVariants[0].label}"`)
      patched = true
    }

    if (!patched) console.log(`✅ "${product.title}" — Already clean, no changes needed`)
  }

  console.log('\n════════════════════════════════════════════')
  console.log('   PATCH COMPLETE')
  console.log('════════════════════════════════════════════\n')

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
