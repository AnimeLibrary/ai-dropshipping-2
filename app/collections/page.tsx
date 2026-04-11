import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import ProductCard from '@/components/commerce/ProductCard'

export const metadata: Metadata = {
  title: 'All Products | TrendDrop',
  description: 'Browse our full collection of problem-solving products.',
}

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const products = await prisma.product.findMany({
    where: { validationStatus: 'approved' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <h1 className="text-4xl text-gradient text-center mb-12">All Products</h1>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
          <p>The catalog is currently empty. Our AI agents are sourcing new products now.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '30px'
        }}>
          {products.map(p => (
            <ProductCard 
                key={p.id} 
                product={{
                    ...p, 
                    price: Number(p.price),
                    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : p.price * 1.5,
                    heroImage: p.heroImage || '/placeholder.png'
                } as any} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
