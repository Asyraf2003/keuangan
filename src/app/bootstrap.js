// src/app/bootstrap.js
import { createShell } from './shell.js'
import { routes } from './routes.js'
import { createHashRouter } from './router.js'
import { setActiveNav } from '../ui/bottomNav.js'
import { initAppData } from './initAppData.js'

export async function bootstrap() {
  const mount = document.querySelector('#app')
  if (!mount) throw new Error('#app not found')

  // init data dulu (IndexedDB)
  await initAppData()

  const { outlet, nav } = createShell(mount)

  const router = createHashRouter({
    routes,
    outlet,
    onRouteChange: (path) => setActiveNav(nav, path),
  })

  router.start()
}
