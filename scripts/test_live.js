async function main() {
  const res = await fetch('https://vexsen.com/')
  const text = await res.text()
  const lines = text.split('\n').filter(l => l.includes('favicon') || l.includes('icon'))
  console.log('Live Favicon Links on vexsen.com:')
  lines.forEach(l => console.log('  ', l.trim()))
}
main()
