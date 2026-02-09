// src/ui/bottomNav.js
import { el } from '../shared/dom.js'
import { AddFab } from './addFab.js'

export function BottomNav() {
  const nav = el('nav', { class: 'bottom-nav', attrs: { role: 'navigation', 'aria-label': 'Main' } },
    navLink('/home', 'Home', 'H'),
    navLink('/history', 'Riwayat', 'R'),
    AddFab(),
    navLink('/reports', 'Laporan', 'L'),
    navLink('/account', 'Akun', 'A'),
  )
  return nav
}

function navLink(path, label, iconText) {
  return el('a', {
    class: 'nav-item',
    href: `#${path}`,
    attrs: { 'data-path': path }
  },
    el('div', { class: 'nav-icon', text: iconText }),
    el('div', { text: label })
  )
}

export function setActiveNav(navRoot, path) {
  const links = navRoot.querySelectorAll('[data-path]')
  links.forEach(a => {
    const p = a.getAttribute('data-path')
    if (p === path) a.setAttribute('aria-current', 'page')
    else a.removeAttribute('aria-current')
  })
}
