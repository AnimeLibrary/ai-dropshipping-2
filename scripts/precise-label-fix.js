/**
 * PRECISE BLUSH + SET LABEL FIX
 * Maps each vid exactly to the correct human-readable label
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs'), path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('='); if (eq < 0) continue;
    const k = t.slice(0, eq).trim(); let v = t.slice(eq+1).trim();
    if (v.length>=2&&v[0]==='"'&&v[v.length-1]==='"') v=v.slice(1,-1);
    if (!process.env[k]) process.env[k]=v;
  }
}

const prisma = new PrismaClient();
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
let _token=null,_tokenExpiry=0,_lastReq=0;
async function getToken(){if(_token&&Date.now()<_tokenExpiry)return _token;const r=await fetch(CJ_BASE+'/authentication/getAccessToken',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:process.env.CJ_API_KEY})});const d=await r.json();_token=d.data.accessToken;_tokenExpiry=Date.now()+23*60*60*1000;return _token;}
async function cjGet(p){const wait=1100-(Date.now()-_lastReq);if(wait>0)await new Promise(r=>setTimeout(r,wait));_lastReq=Date.now();const token=await getToken();const res=await fetch(CJ_BASE+p,{headers:{'CJ-Access-Token':token}});return res.json().catch(()=>null);}

function labelFromKey(key) {
  const k = (key || '').trim();
  
  // Lip Oil: "Set1"-"Set4" → "2-Pack Combo N"
  const setMatch = k.match(/^[Ss]et(\d+)$/);
  if (setMatch) return `2-Pack Combo ${setMatch[1]}`;
  
  // Lip Oil individual: "01"-"08" → "Shade 01"-"Shade 08"
  const numMatch = k.match(/^0?(\d+)$/);
  if (numMatch && parseInt(numMatch[1]) <= 8) return `Shade ${String(parseInt(numMatch[1])).padStart(2, '0')}`;
  
  // Blush: "Shade 01"-"Shade 06" → keep clean
  const shadeMatch = k.match(/^[Ss]hade\s*0?(\d+)$/);
  if (shadeMatch) return `Shade ${String(parseInt(shadeMatch[1])).padStart(2, '0')}`;
  
  // Blush: "01 2PC", "02 2PC" etc → "Shade 01 — 2-Pack"
  const twoPackMatch = k.match(/^(\d+)\s+2[Pp][Cc]$/);
  if (twoPackMatch) return `Shade ${String(parseInt(twoPackMatch[1])).padStart(2, '0')} — 2-Pack`;
  
  // Blush bundles: "Set", "Set1"-"Set10" → "Bundle Set", "Bundle Set N"
  if (/^[Ss]et$/.test(k)) return 'Bundle Set';
  const bundleMatch = k.match(/^[Ss]et(\d+)$/);
  if (bundleMatch) return `Bundle Set ${bundleMatch[1]}`;
  
  return null; // no change needed
}

async function main() {
  console.log('\n═══ PRECISE LABEL FIX ═══\n');
  await getToken();

  // ── LIP OIL ─────────────────────────────────────────────────────
  const lipOilDb = await prisma.product.findFirst({where:{cjProductId:'1791643240295305216'},include:{variants:true}});
  if (lipOilDb) {
    const data = await cjGet('/product/query?pid=1791643240295305216');
    const rawVariants = data?.data?.variants || [];
    for (const v of rawVariants) {
      const key = (v.variantKey || '').trim();
      const dbV = lipOilDb.variants.find(dv => dv.vid === String(v.vid));
      if (!dbV) continue;
      const newLabel = labelFromKey(key);
      if (newLabel && newLabel !== dbV.label) {
        await prisma.productVariant.update({where:{id:dbV.id},data:{label:newLabel}});
        console.log(`✅ Lip Oil [${key}]: "${dbV.label}" → "${newLabel}"`);
      } else {
        console.log(`✔  Lip Oil [${key}]: "${dbV.label}" ✓`);
      }
    }
  }

  // ── BLUSH DUO ────────────────────────────────────────────────────
  const blushDb = await prisma.product.findFirst({where:{cjProductId:'1795261101102342144'},include:{variants:true}});
  if (blushDb) {
    const data = await cjGet('/product/query?pid=1795261101102342144');
    const rawVariants = data?.data?.variants || [];
    for (const v of rawVariants) {
      const key = (v.variantKey || '').trim();
      const dbV = blushDb.variants.find(dv => dv.vid === String(v.vid));
      if (!dbV) continue;

      let newLabel = null;
      // "Set" variants
      if (/^Set$/i.test(key)) newLabel = 'Bundle Set';
      else if (/^Set\d+$/i.test(key)) {
        const m = key.match(/\d+/);
        newLabel = `Bundle Set ${m[0]}`;
      }
      // "N 2PC" variants — extract exact leading number
      else if (/^\d+\s+2PC$/i.test(key)) {
        const m = key.match(/^(\d+)/);
        newLabel = `Shade ${String(parseInt(m[1])).padStart(2, '0')} — 2-Pack`;
      }
      // "Shade N" — already clean, standardize padding
      else if (/^Shade\s*\d+$/i.test(key)) {
        const m = key.match(/\d+/);
        newLabel = `Shade ${String(parseInt(m[0])).padStart(2, '0')}`;
      }

      if (newLabel && newLabel !== dbV.label) {
        await prisma.productVariant.update({where:{id:dbV.id},data:{label:newLabel}});
        console.log(`✅ Blush [${key}]: "${dbV.label}" → "${newLabel}"`);
      } else {
        console.log(`✔  Blush [${key}]: "${dbV.label}" ✓`);
      }
    }
  }

  console.log('\n═══ DONE ═══\n');

  // Print final state from DB
  console.log('\n📋 FINAL DATABASE STATE:\n');
  const products = await prisma.product.findMany({
    where: { cjProductId: { not: null } },
    include: { variants: { orderBy: { label: 'asc' } } },
    orderBy: { title: 'asc' }
  });
  for (const p of products) {
    console.log(`\n"${p.title}" (${p.variants.length} variants):`);
    p.variants.forEach((v,i) => {
      const img = v.image ? '✓img' : '✗img';
      console.log(`  [${i+1}] "${v.label}" | $${v.retailPrice} | ${img} | default:${v.isDefault}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
