// Minimal local placeholder worker for ThatOpen fragments (mobile viewer)
self.addEventListener('message', (e) => {
  self.postMessage({ type: 'fallback', data: 'local-worker-unavailable' })
})
