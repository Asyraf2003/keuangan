// src/ui/addFab.js
import { el } from '../shared/dom.js'

export function AddFab() {
  let open = false

  const menu = el('div', { class: 'fab-menu', attrs: { 'aria-hidden': 'true' } },
    actionBtn('fab-action transfer', '0', 'Transfer', () => go('/add?mode=transfer')),
    actionBtn('fab-action plus', '+', 'Tambah (Income)', () => go('/add?mode=income')),
    actionBtn('fab-action minus', '−', 'Kurang (Expense)', () => go('/add?mode=expense')),
  )

  const toggleBtn = el(
    'button',
    {
      class: 'fab-toggle',
      attrs: { type: 'button', 'aria-label': 'Tambah Transaksi (QRIS)', 'aria-expanded': 'false' },
      onclick: (e) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(!open)
      },
    },
    'QR'
  )

  const label = el('div', { class: 'nav-add-label', text: 'Tambah' })

  const root = el('div', { class: 'nav-add' }, toggleBtn, menu, label)

  // close kalau klik di luar
  document.addEventListener('click', (e) => {
    if (!open) return
    if (!root.contains(e.target)) setOpen(false)
  })

  function setOpen(next) {
    open = next
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false')
    menu.classList.toggle('open', open)
    menu.setAttribute('aria-hidden', open ? 'false' : 'true')
  }

  function go(path) {
    setOpen(false)
    location.hash = `#${path}`
  }

  return root
}

function actionBtn(className, text, ariaLabel, onClick) {
  return el(
    'button',
    {
      class: className,
      attrs: { type: 'button', 'aria-label': ariaLabel },
      onclick: (e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      },
    },
    text
  )
}
