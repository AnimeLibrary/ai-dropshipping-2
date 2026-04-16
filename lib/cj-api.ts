const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

export async function getCjToken() {
  const email = process.env.CJ_EMAIL
  const password = process.env.CJ_API_KEY

  if (!email || !password) {
    throw new Error('CJ API credentials missing in .env')
  }

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()
  if (!data?.data?.accessToken) {
    throw new Error('Failed to fetch CJ access token: ' + JSON.stringify(data))
  }
  return data.data.accessToken
}

/**
 * Search the CJ Dropshipping database for a product by its name or keyword.
 */
export async function searchCjProducts(keyword: string) {
  const token = await getCjToken()
  
  const res = await fetch(`${CJ_BASE}/product/list?pageNum=1&pageSize=5&productNameEn=${encodeURIComponent(keyword)}`, {
    headers: { 'CJ-Access-Token': token },
  })

  const data = await res.json()
  return data?.data?.list || []
}

/**
 * Fetch detailed variants for a specific CJ Product ID.
 */
export async function getCjProductDetails(pid: string) {
  const token = await getCjToken()
  
  // According to CJ Dropshipping API, product details endpoint requires the pid.
  const res = await fetch(`${CJ_BASE}/product/query?pid=${pid}`, {
    headers: { 'CJ-Access-Token': token },
  })
  const data = await res.json()
  
  // Contains product information including variant arrays (SKUs, Colors, Sizes, prices, etc).
  return data?.data || null
}
