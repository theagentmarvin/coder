// Minimal local placeholder worker for ThatOpen fragments
// This file is a best-effort fallback when CDN is unreachable.
// It does not implement the full worker API. For production, vendor the official worker.

self.addEventListener('message', (e) => {
  // respond with a simple echo so fragments.init doesn't completely fail
  self.postMessage({ type: 'fallback', data: 'local-worker-unavailable' })
})
