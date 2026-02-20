// Simple static server for a specified directory
const http = require('http')
const fs = require('fs')
const path = require('path')
const port = process.argv[2] ? Number(process.argv[2]) : 8080
const root = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(__dirname, '..', 'bim-fragment-viewer', 'dist')

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0])
  if (reqPath === '/') reqPath = '/index.html'
  const filePath = path.join(root, reqPath)

  if (!filePath.startsWith(root)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    if (stats.isDirectory()) {
      res.writeHead(302, { Location: reqPath + '/' })
      res.end()
      return
    }
    const ext = path.extname(filePath)
    const type = mime[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type })
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  })
})

server.listen(port, () => {
  console.log(`Static server serving ${root} on http://localhost:${port}`)
})

// Graceful shutdown
process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
