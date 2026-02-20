import puppeteer from 'puppeteer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const serverRoot = path.resolve(__dirname, '..')

  // Allow overriding the URL via SMOKE_URL env var (useful for running a local http server)
  const defaultUrl = 'file://' + path.join(serverRoot, 'bim-fragment-viewer', 'dist', 'index.html')
  const url = process.env.SMOKE_URL || defaultUrl

  try {
    // Capture console logs
    const logs = []
    page.on('console', (msg) => logs.push(msg.text()))

    await page.goto(url, { waitUntil: 'load', timeout: 120000 })
    console.log('Loaded viewer page (load event)')

    // Wait a bit for fragments to load
    await new Promise((r) => setTimeout(r, 3000))

    // Click centre of the viewer container
    await page.mouse.click(400, 300)
    await new Promise((r) => setTimeout(r, 1000))

    console.log('Logs captured (tail):', logs.slice(-20))
  } catch (e) {
    console.error('Smoke test failed', e)
    process.exit(2)
  } finally {
    await browser.close()
  }
})()
