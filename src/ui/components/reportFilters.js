import { el } from '../../shared/dom.js'
import { nowMs } from '../../domain/time.js'
import { toDateInputValue, fromDateInputValue } from '../../domain/dateInput.js'

function startOfMonthMs(ms) {
  const d = new Date(ms)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function createReportFilters({ wallets, categories } = {}) {
  const startInput = el('input', { attrs: { type: 'date', required: 'true' } })
  const endInput = el('input', { attrs: { type: 'date', required: 'true' } })

  const now = nowMs()
  startInput.value = toDateInputValue(startOfMonthMs(now))
  endInput.value = toDateInputValue(now)

  const viewSel = el('select', {},
    el('option', { attrs: { value: 'summary' }, text: 'Ringkasan (sekali hitung)' }),
    el('option', { attrs: { value: 'monthly' }, text: 'Bulanan (group by bulan)' }),
  )

  const walletSel = el('select', {},
    el('option', { attrs: { value: '' }, text: 'Semua dompet' }),
    ...wallets.map(w => el('option', {
      attrs: { value: w.id },
      text: w.status === 'archived' ? `${w.name} (archived)` : w.name
    }))
  )

  const catSel = el('select', {},
    el('option', { attrs: { value: '' }, text: 'Semua kategori' }),
    el('option', { attrs: { value: '__null__' }, text: 'Tanpa kategori' }),
    ...categories.map(c => el('option', {
      attrs: { value: c.id },
      text: c.status === 'archived' ? `${c.name} (${c.type}) (archived)` : `${c.name} (${c.type})`
    }))
  )

  const typeSel = el('select', {},
    el('option', { attrs: { value: 'all' }, text: 'All' }),
    el('option', { attrs: { value: 'income' }, text: 'Income' }),
    el('option', { attrs: { value: 'expense' }, text: 'Expense' }),
  )

  const includeTransfer = el('input', { attrs: { type: 'checkbox' } })
  const applyBtn = el('button', { attrs: { type: 'button' } }, 'Terapkan')

  const root = el('div', { class: 'card', attrs: { style: 'padding:10px; display:grid; gap:10px;' } },
    field('Mode', viewSel),
    field('Start', startInput),
    field('End', endInput),
    field('Dompet', walletSel),
    field('Kategori', catSel),
    field('Tipe', typeSel),
    el('label', { attrs: { style: 'display:flex; gap:8px; align-items:center; font-size:12px;' } },
      includeTransfer,
      el('span', { text: 'Hitung transfer out/in (biasanya OFF)' })
    ),
    applyBtn
  )

  function getValues() {
    const startMs = fromDateInputValue(startInput.value)
    const endMs = fromDateInputValue(endInput.value) + (24 * 60 * 60 * 1000 - 1)

    const walletId = walletSel.value || null
    const rawCat = catSel.value || ''
    const categoryId = rawCat === '' ? null : (rawCat === '__null__' ? null : rawCat)

    const txType = typeSel.value || 'all'
    const includeTransferMovements = includeTransfer.checked
    const view = viewSel.value || 'summary'

    return {
      view,
      startMs,
      endMs,
      walletId,
      categoryId: rawCat === '__null__' ? null : categoryId,
      txType,
      includeTransferMovements
    }
  }

  function onApply(fn) {
    applyBtn.onclick = () => fn(getValues())
  }

  return { root, getValues, onApply }
}

function field(label, inputEl) {
  return el('label', { attrs: { style: 'display:grid; gap:6px;' } },
    el('div', { attrs: { style: 'font-size:12px; color:#333; font-weight:600;' }, text: label }),
    inputEl
  )
}
