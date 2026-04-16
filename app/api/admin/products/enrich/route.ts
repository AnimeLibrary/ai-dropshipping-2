import { NextResponse } from 'next/server'
import { searchCjProducts, getCjProductDetails } from '@/lib/cj-api'
import { prisma } from '@/lib/db/prisma'


export async function POST(req: Request) {
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

    // 2. Fetch full variants list using the cjProductId
    const cjDetails = await getCjProductDetails(cjProductId)
    if (!cjDetails) {
      return NextResponse.json({ error: 'Failed to fetch details for CJ product.' }, { status: 404 })
    }

    const cjVariants = cjDetails.variants || []

    // 3. Update the Prisma database with the cjProductId and full variant list
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        cjProductId,
        cjVariants, // save the entire variants array to the product
      },
    })

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
