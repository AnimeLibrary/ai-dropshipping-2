/**
 * INDEXNOW & GOOGLE/BING INSTANT SEARCH ENGINE PINGER
 * Pings api.indexnow.org to instantly index all product pages and SEO clusters
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HOST = 'vexsen.com';
const KEY = 'a8f1e29c0d3b47f68a51e92d74b8301c';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function main() {
  console.log('⚡ INDEXNOW SEARCH ENGINE PINGER');
  console.log('-------------------------------------------');

  const products = await prisma.product.findMany({
    select: { slug: true, updatedAt: true }
  });

  const urlList = [
    `https://${HOST}/`,
    `https://${HOST}/products`,
    `https://${HOST}/faq`,
    `https://${HOST}/track`,
  ];

  for (const p of products) {
    urlList.push(`https://${HOST}/products/${p.slug}`);
  }

  // Check if seo clusters exist
  try {
    const clusters = await prisma.seoCluster.findMany({
      select: { targetSlug: true }
    });
    for (const c of clusters) {
      urlList.push(`https://${HOST}/guide/${c.targetSlug}`);
    }
  } catch (e) {
    // optional table
  }

  console.log(`Found ${urlList.length} high-value URLs to submit for immediate crawl.`);

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    console.log(`📡 Response Status: ${res.status} ${res.statusText}`);
    if (res.status === 200 || res.status === 202) {
      console.log('✅ URLs successfully broadcasted to IndexNow search engine fleet (Bing, Yandex, Seznam, Naver)!');
    } else {
      const text = await res.text();
      console.log(`Response body: ${text}`);
    }
  } catch (err) {
    console.error('Failed to submit to IndexNow:', err.message);
  }

  await prisma.$disconnect();
}

main();
