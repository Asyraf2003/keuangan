// src/app/router.js
export function createHashRouter({ routes, outlet, onRouteChange }) {
  function parseHash() {
    const raw = location.hash || '#/home'
    let full = raw.startsWith('#') ? raw.slice(1) : raw
    if (!full.startsWith('/')) full = `/${full}`

    const [pathname, search = ''] = full.split('?')
    const query = Object.fromEntries(new URLSearchParams(search))
    return { pathname, query, fullPath: full }
  }

  function render() {
    const { pathname, query, fullPath } = parseHash()
    const handler = routes[pathname] || routes['/home']
    handler(outlet, { path: pathname, query, fullPath })
    onRouteChange?.(pathname)
  }

  function start() {
    window.addEventListener('hashchange', render)
    render()
  }

  function go(path) {
    location.hash = `#${path}`
  }

  return { start, go }
}
