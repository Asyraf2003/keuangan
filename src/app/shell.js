// src/app/shell.js
import { el } from '../shared/dom.js'
import { BottomNav } from '../ui/bottomNav.js'

export function createShell(mount) {
  const outlet = el('main', { class: 'app-main', attrs: { id: 'outlet' } })

  const nav = BottomNav()

  const shell = el('div', { class: 'app-shell' },
    el('header', { class: 'app-header' },
      el('div', { class: 'app-title', text: 'Finance PWA (Offline-first) - Skeleton' })
    ),
    outlet,
    nav
  )

  mount.replaceChildren(shell)

  return { outlet, nav }
}
