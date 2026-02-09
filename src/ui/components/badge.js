import { el } from '../../shared/dom.js'

export function Badge({ icon = '•', color = '#111111' } = {}) {
  return el('div', {
    attrs: {
      style: [
        'width:28px',
        'height:28px',
        'border-radius:999px',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        `background:${color}`,
        'color:#fff',
        'font-size:16px',
        'flex: 0 0 auto',
      ].join(';')
    },
    text: icon
  })
}
