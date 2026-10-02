import { NextResponse } from 'next/server'
import { searchCjProducts, getCjProductDetails } from '@/lib/cj-api'
import { cj } from '@/lib/services/cj-service'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'


export async function POST(req: Request) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { productId, keyword } = await req.json()

    if (!productId || !keyword) {
      return NextResponse.json({ error: 'Missing productId or keyword' }, { status: 400 })
    }

    // 1. Search CJ dropshipping by keyword/name
    const searchResults = await searchCjProducts(keyword)
    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({ error: 'No matching products found on CJ Dropshipping.' }, { status: 404 })
    }

    // Grab the best matching result (for now, simply the first one)
    const bestMatch = searchResults[0]
    const cjProductId = bestMatch.pid

    // 2. Fetch full variants list using cj service
    const full = await cj.getFullProductWithVariants(cjProductId)
    if (!full) {
      return NextResponse.json({ error: 'Failed to fetch details for CJ product.' }, { status: 404 })
    }

    const cjVariants = full.variants || []

    // 3. Update the Prisma database with the cjProductId and full variant list
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        cjProductId,
        cjVariants: cjVariants as any,
        cjLastSyncedAt: new Date(),
      },
      include: { variants: true }
    })

    // 4. Create or update ProductVariant records in Prisma
    for (const [idx, v] of cjVariants.entries()) {
      const existing = updatedProduct.variants.find(pv => pv.vid === v.vid)
      if (existing) {
        await prisma.productVariant.update({
          where: { id: existing.id },
          data: {
            label: v.label,
            color: v.color || null,
            size: v.size || null,
            image: v.image || existing.image,
            cjStock: v.stock,
            supplierPrice: v.supplierPrice,
          }
        })
      } else {
        await prisma.productVariant.create({
          data: {
            productId: updatedProduct.id,
            vid: v.vid,
            sku: v.sku,
            label: v.label,
            color: v.color || null,
            size: v.size || null,
            supplierPrice: v.supplierPrice,
            retailPrice: updatedProduct.price,
            cjStock: v.stock,
            image: v.image || updatedProduct.heroImage,
            isDefault: idx === 0,
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully enriched product with ${cjVariants.length} variants.`,
      product: updatedProduct,
    })
  } catch (error: any) {
    console.error('Error enriching CJ product:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
