const puppeteer = require('puppeteer')
const path = require('path')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const serverRoot = path.resolve(__dirname, '..')

  // Serve workspace root with a tiny static server: use data URL instead for headless smoke test
  const url = 'file://' + path.join(serverRoot, 'bim-fragment-viewer', 'dist', 'index.html')

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    console.log('Loaded viewer page')

    // Wait a bit for fragments to load
    await page.waitForTimeout(3000)

    // Click centre of the viewer container
    await page.mouse.click(400, 300)
    await page.waitForTimeout(1000)

    // Capture console logs
    const logs = []
    page.on('console', (msg) => logs.push(msg.text()))

    console.log('Logs:', logs.slice(-20))
  } catch (e) {
    console.error('Smoke test failed', e)
    process.exit(2)
  } finally {
    await browser.close()
  }
})()
