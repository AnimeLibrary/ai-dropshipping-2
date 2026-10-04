const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const key = env.match(/CJ_API_KEY=([^\r\n]+)/)[1].replace(/["']/g, '').trim();

async function test() {
  const tRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: key })
  });
  const tData = await tRes.json();
  const token = tData.data.accessToken;

  const pRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=1795261101102342144', {
    headers: { 'CJ-Access-Token': token }
  });
  const pData = await pRes.json();
  console.log('Result code:', pData.code, 'message:', pData.message);
  console.log('Variants count:', pData.data?.variants?.length);
  if (pData.data?.variants) {
    pData.data.variants.forEach(v => {
      console.log(`vid: ${v.vid} | key: "${v.variantKey}" | name: "${v.variantNameEn}" | img: ${v.variantImage ? 'YES' : 'NO'}`);
    });
  }
}
test();
