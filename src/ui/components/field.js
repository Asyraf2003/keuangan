import { el } from '../../shared/dom.js'

export function field(label, inputEl) {
  return el('label', { attrs: { style: 'display:grid; gap:6px;' } },
    el('div', { attrs: { style: 'font-size:12px; color:#333; font-weight:600;' }, text: label }),
    inputEl
  )
}
