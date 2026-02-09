import { el } from '../../shared/dom.js'

export function txItem(tx, { walletMap, catMap, onDelete, onEdit }) {
  const w = walletMap.get(tx.wallet_id)
  const c = tx.category_id ? catMap.get(tx.category_id) : null

  const date = new Date(tx.occurred_at_ms).toLocaleDateString('id-ID')
  const time = new Date(tx.occurred_at_ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n)

  const kind =
    tx.type === 'income' ? `Masuk ${fmt(tx.amount)}`
    : tx.type === 'expense' ? `Keluar ${fmt(tx.amount)}`
    : `Adjust ${fmt(tx.amount)}`

  const meta = [
    `${date} ${time}`,
    w ? w.name : tx.wallet_id,
    tx.group_type === 'transfer' ? `transfer:${tx.group_role || '?'}` : null,
    c ? `cat:${c.name}` : null,
    `status:${tx.status}`
  ].filter(Boolean).join(' • ')

  const editBtn = onEdit
    ? el('button', { attrs: { type: 'button' }, onclick: () => onEdit?.() }, 'Edit')
    : null

  const delBtn = onDelete
    ? el('button', { attrs: { type: 'button' }, onclick: () => onDelete?.() }, 'Hapus')
    : null

  if (tx.status !== 'active') {
    if (delBtn) delBtn.disabled = true
    if (editBtn) editBtn.disabled = true
  }

  const actions = [editBtn, delBtn].filter(Boolean)

  return el('div', { class: 'card', attrs: { style: 'padding:10px;' } },
    el('div', { attrs: { style: 'font-size:12px; color:#555;' }, text: meta }),
    el('div', { attrs: { style: 'font-size:16px; font-weight:800; margin-top:6px;' }, text: kind }),
    tx.note ? el('div', { attrs: { style: 'font-size:12px; color:#333; margin-top:6px;' }, text: tx.note }) : '',
    actions.length
      ? el('div', { attrs: { style: 'display:flex; justify-content:flex-end; gap:10px; margin-top:10px;' } }, ...actions)
      : ''
  )
}
