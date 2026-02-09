import { clear, el } from '../../shared/dom.js'
import { listWallets } from '../../infra/repos/walletRepo.js'
import { listCategories } from '../../infra/repos/categoryRepo.js'

import { txItem } from '../../ui/components/txItem.js'
import { createHistoryFilters } from '../../ui/components/historyFilters.js'

import { getHistory } from '../../application/history/getHistory.js'
import { deleteEntry } from '../../application/history/deleteEntry.js'

export function renderHistory(outlet) {
  clear(outlet)

  const wrap = el('div', { class: 'card' },
    el('h1', { class: 'h1', text: 'Riwayat' }),
    el('p', { class: 'p', text: 'Loading…' }),
  )
  outlet.append(wrap)

  ;(async () => {
    const [wallets, categories] = await Promise.all([
      listWallets({ includeArchived: true }),
      listCategories({ includeArchived: true }),
    ])

    const walletMap = new Map(wallets.map(w => [w.id, w]))
    const catMap = new Map(categories.map(c => [c.id, c]))

    const infoLine = el('p', { class: 'p', text: '' })
    const listRoot = el('div', { attrs: { style: 'display:grid; gap:10px; margin-top:12px;' } })

    const filters = createHistoryFilters({ wallets, categories, initialStatus: 'active' })

    wrap.replaceChildren(
      el('h1', { class: 'h1', text: 'Riwayat' }),
      el('p', { class: 'p', text: 'Transfer adalah group (out/in/fee). Aksi Edit/Hapus hanya di leg utama.' }),
      filters.root,
      infoLine,
      listRoot
    )

    async function load(values) {
      infoLine.textContent = 'Loading…'
      listRoot.replaceChildren()

      const { items } = await getHistory(values)
      infoLine.textContent = `Hasil: ${items.length} transaksi`

      listRoot.replaceChildren(
        ...items.map(tx => {
          const isTransfer = tx.group_type === 'transfer'
          const isPrimaryTransferLeg = isTransfer ? (tx.group_role === 'out') : true

          const canEdit =
            tx.status === 'active' &&
            (tx.type === 'income' || tx.type === 'expense') &&
            isPrimaryTransferLeg

          const canDelete =
            tx.status === 'active' &&
            isPrimaryTransferLeg

          return txItem(tx, {
            walletMap,
            catMap,
            onDelete: canDelete
              ? async () => {
                  const ok = confirm(isTransfer ? 'Hapus TRANSFER ini? (semua leg jadi deleted)' : 'Hapus transaksi ini?')
                  if (!ok) return
                  await deleteEntry(tx.id)
                  await load(filters.getValues())
                }
              : null,
            onEdit: canEdit
              ? () => {
                  const isT = !!tx.group_id
                  location.hash = isT
                    ? `#/add?mode=transfer&edit=${tx.id}`
                    : `#/add?mode=${tx.type}&edit=${tx.id}`
                }
              : null,
          })
        })
      )
    }

    filters.onApply(load)
    filters.onReset(load)
    await load(filters.getValues())
  })().catch((e) => {
    console.error(e)
    wrap.replaceChildren(
      el('h1', { class: 'h1', text: 'Riwayat' }),
      el('p', { class: 'p', text: 'Gagal load. Cek console.' })
    )
  })
}
