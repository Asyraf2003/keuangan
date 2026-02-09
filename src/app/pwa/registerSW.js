export function registerSW() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' })

      // send version to SW via a global (best-effort)
      const v = import.meta.env.VITE_APP_VERSION || 'dev'

      // if there's a waiting SW, ask it to activate
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING', version: v })
      }

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            // new update available, activate it
            sw.postMessage({ type: 'SKIP_WAITING', version: v })
          }
        })
      })

      // reload once controller changes (means new SW active)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })

      // pass version into SW global scope (hack: using a fetch to a versioned URL)
      // not perfect, but forces new SW install when version changes
      // (cache name already versioned anyway)
      await fetch(`./sw.js?v=${encodeURIComponent(v)}`, { cache: 'no-store' }).catch(() => {})
    } catch (e) {
      console.error('SW register failed', e)
    }
  })
}
