const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const key = env.match(/CJ_API_KEY=([^\r\n]+)/)[1].replace(/["']/g, '').trim();

async function inspectProduct(token, pid, name) {
  console.log(`\n================== ${name} (${pid}) ==================`);
  const res = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${pid}`, {
    headers: { 'CJ-Access-Token': token }
  });
  const data = await res.json();
  const variants = data.data?.variants || [];
  console.log(`Total variants from CJ: ${variants.length}`);
  variants.forEach((v, idx) => {
    console.log(`[${idx+1}] vid: ${v.vid} | key: "${v.variantKey}" | name: "${v.variantNameEn}" | price: $${v.variantSellPrice} | img: ${v.variantImage}`);
  });
}

async function main() {
  const tRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: key })
  });
  const tData = await tRes.json();
  const token = tData.data.accessToken;

  await inspectProduct(token, '1791643240295305216', 'PHOFAY Juicy Lip Oil');
  await new Promise(r => setTimeout(r, 2000));
  await inspectProduct(token, '1795261101102342144', 'PHOFAY Double-Take Blush Duo');
  await new Promise(r => setTimeout(r, 2000));
  await inspectProduct(token, '2407260539521626900', 'PHOFAY Lip Tint');
  await new Promise(r => setTimeout(r, 2000));
  await inspectProduct(token, '2410220715201611900', 'Vexsen Lip Stain');
}

main().catch(console.error);
