const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

async function test() {
  const res = await fetch(CJ_BASE + '/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "brannenguidry28@gmail.com", password: "CJ5319398@api@131aed8ed9784c3296a47b26c31585b3" })
  })
  
  const data = await res.json()
  console.log('Auth result:', data)
  
  if (data.data && data.data.accessToken) {
    const res2 = await fetch(CJ_BASE + '/product/list?pageNum=1&pageSize=5&productNameEn=bestseller', {
      headers: { 'CJ-Access-Token': data.data.accessToken }
    })
    console.log('Search result:', (await res2.json()).data?.list?.length + ' products found')
  }
}
test()
