import { prisma } from './lib/db/prisma';
import { enrichProductWithAI } from './lib/ai/agent-tools';

async function patch() {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, title: true, niche: true, shortDescription: true, heroImage: true }
  });

  for (const p of products) {
    const updates: any = {};

    // 1. Wipe poisoned shortDescription
    if (p.shortDescription && /supplier\s+price|sourced\s+from\s+cj|passes\s+all\s+financial|recommended\s+for\s+immediate\s+approval|niche\s+saturation/i.test(p.shortDescription)) {
      updates.shortDescription = null;
      console.log('Cleared shortDescription for:', p.slug);
    }

    // 2. Unpack JSON image array -> use first image as heroImage
    if (p.heroImage && p.heroImage.startsWith('[')) {
      try {
        const imgs = JSON.parse(p.heroImage);
        if (Array.isArray(imgs) && imgs.length > 0) {
          updates.heroImage = imgs[0];
          console.log('Unpacked heroImage for:', p.slug, '->', imgs[0].slice(0, 60));
        }
      } catch {}
    }

    if (Object.keys(updates).length > 0) {
      await prisma.product.update({ where: { id: p.id }, data: updates });
      console.log('Patched:', p.slug);
    }
    
    // 3. Fire enrichment to get the AI copy and Serper image
    console.log('Enriching:', p.title);
    try {
      const res = await enrichProductWithAI(p.id, p.title, p.niche);
      console.log('Enrichment result:', JSON.stringify(res, null, 2));
    } catch (e: any) {
      console.error('Enrichment failed:', e.message);
    }
  }
}

patch()
  .then(() => {
    console.log('Script done.');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
