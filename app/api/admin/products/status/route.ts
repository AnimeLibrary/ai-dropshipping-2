import { prisma } from '@/lib/db/prisma'


export async function POST(req: Request) {
  try {
    const { productId, status } = await req.json()

    if (!productId || !status) {
      return NextResponse.json({ error: 'Missing productId or status' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { validationStatus: status },
    })

    return NextResponse.json({
      success: true,
      message: `Product status updated to ${status}.`,
      product: updatedProduct,
    })
  } catch (error: any) {
    console.error('Error updating product status:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
