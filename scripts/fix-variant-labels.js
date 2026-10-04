/**
 * FINAL LABEL CLEANUP
 * Fixes "2-Pack Combo undefined" → proper labels
 * Fixes Blush Duo "Set", "01 2PC" style labels 
 * Fixes Lip Oil Set labels to actual content (fetched from CJ)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('='); if (eq < 0) continue;
    const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
    if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') v = v.slice(1, -1);
    else if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const prisma = new PrismaClient();
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
let _token = null, _tokenExpiry = 0, _lastReq = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const r = await fetch(CJ_BASE + '/authentication/getAccessToken', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: process.env.CJ_API_KEY })
  });
  const d = await r.json();
  _token = d.data.accessToken;
  _tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return _token;
}

async function cjGet(p) {
  const wait = 1100 - (Date.now() - _lastReq);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _lastReq = Date.now();
  const token = await getToken();
  const res = await fetch(CJ_BASE + p, { headers: { 'CJ-Access-Token': token } });
  return res.json().catch(() => null);
}

async function main() {
  console.log('\n═══ FINAL LABEL CLEANUP ═══\n');
  await getToken();

  // ─── FIX LIP OIL SET LABELS ────────────────────────────────────
  // CJ variantKey values for these are "Set1", "Set2", "Set3", "Set4"
  // They represent 2-packs of specific shade combinations
  // Let's give them cleaner names based on their actual CJ images
  const lipOilDb = await prisma.product.findFirst({
    where: { cjProductId: '1791643240295305216' },
    include: { variants: true }
  });

  if (lipOilDb) {
    // Re-fetch CJ data to map vids to keys
    const data = await cjGet('/product/query?pid=1791643240295305216');
    const rawVariants = data?.data?.variants || [];

    for (const v of rawVariants) {
      const key = (v.variantKey || '').trim();
      const dbVariant = lipOilDb.variants.find(dv => dv.vid === String(v.vid));
      if (!dbVariant) continue;

      let newLabel = dbVariant.label;

      // Fix the "2-Pack Combo undefined" issue by using the set number from key
      if (/^Set(\d+)$/i.test(key)) {
        const match = key.match(/^Set(\d+)$/i);
        const num = match ? match[1] : '?';
        newLabel = `2-Pack Combo ${num}`;
      }

      // Shade variants: "01" → "Shade 01"
      if (/^0?[1-8]$/.test(key)) {
        const num = parseInt(key);
        newLabel = `Shade ${String(num).padStart(2, '0')}`;
      }

      if (newLabel !== dbVariant.label) {
        await prisma.productVariant.update({
          where: { id: dbVariant.id },
          data: { label: newLabel }
        });
        console.log(`✅ Lip Oil: "${dbVariant.label}" → "${newLabel}"`);
      } else {
        console.log(`✔  Lip Oil: "${dbVariant.label}" unchanged`);
      }
    }
  }

  // ─── FIX BLUSH DUO LABELS ──────────────────────────────────────
  const blushDb = await prisma.product.findFirst({
    where: { cjProductId: '1795261101102342144' },
    include: { variants: true }
  });

  if (blushDb) {
    const data = await cjGet('/product/query?pid=1795261101102342144');
    const rawVariants = data?.data?.variants || [];

    for (const v of rawVariants) {
      const key = (v.variantKey || '').trim();
      const dbVariant = blushDb.variants.find(dv => dv.vid === String(v.vid));
      if (!dbVariant) continue;

      let newLabel = dbVariant.label;
      const keyLower = key.toLowerCase();

      // "Set1"..."Set10" → "Bundle Set N"
      if (/^set\d+$/i.test(key)) {
        const match = key.match(/(\d+)/);
        newLabel = `Bundle Set ${match ? match[1] : ''}`;
      }
      // Legacy "Set" (no number) → "Bundle Set"
      else if (keyLower === 'set') {
        newLabel = 'Bundle Set';
      }
      // "01 2PC", "02 2PC", "03 2PC" etc → "Shade 01 — 2-Pack"
      else if (/\d+\s*2pc/i.test(key)) {
        const match = key.match(/(\d+)/);
        if (match) newLabel = `Shade ${String(parseInt(match[1])).padStart(2, '0')} — 2-Pack`;
      }

      if (newLabel !== dbVariant.label) {
        await prisma.productVariant.update({
          where: { id: dbVariant.id },
          data: { label: newLabel }
        });
        console.log(`✅ Blush: "${dbVariant.label}" → "${newLabel}"`);
      } else {
        console.log(`✔  Blush: "${dbVariant.label}" unchanged`);
      }
    }
  }

  console.log('\n═══ ALL LABELS CLEANED ═══\n');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
