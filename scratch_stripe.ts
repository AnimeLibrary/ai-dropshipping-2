import { prisma } from './lib/db/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' });

async function fix() {
  const p = await prisma.product.findFirst();
  if (!p) return console.log('No product found');
  
  if (p.stripePriceId) return console.log('Already has a price ID');

  console.log('Creating Stripe Product + Price for:', p.title);
  
  const stripeProd = await stripe.products.create({
    name: p.title,
    images: p.heroImage ? [p.heroImage] : [],
    metadata: { productId: p.id }
  });

  const stripePrice = await stripe.prices.create({
    product: stripeProd.id,
    unit_amount: Math.round(Number(p.price) * 100),
    currency: 'usd',
  });

  await prisma.product.update({
    where: { id: p.id },
    data: { 
      stripeProductId: stripeProd.id,
      stripePriceId: stripePrice.id
    }
  });

  console.log('Fixed! Price ID:', stripePrice.id);
  process.exit(0);
}
fix().catch((e) => {
  console.error(e);
  process.exit(1);
});
