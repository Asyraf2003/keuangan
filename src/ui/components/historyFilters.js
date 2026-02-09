import { el } from '../../shared/dom.js'
import { field } from './field.js'

export function createHistoryFilters({ wallets, categories, initialStatus = 'active' }) {
  const startInput = el('input', { attrs: { type: 'date' } })
  const endInput = el('input', { attrs: { type: 'date' } })

  const walletSel = el('select', {},
    el('option', { attrs: { value: '' }, text: 'Semua dompet' }),
    ...wallets.map(w => el('option', { attrs: { value: w.id }, text: w.name }))
  )

  const catSel = el('select', {},
    el('option', { attrs: { value: '' }, text: 'Semua kategori' }),
    ...categories
      .map(c => el('option', { attrs: { value: c.id }, text: `${c.type}: ${c.name}` }))
  )

  const typeSel = el('select', {},
    el('option', { attrs: { value: '' }, text: 'Semua tipe' }),
    el('option', { attrs: { value: 'income' }, text: 'income' }),
    el('option', { attrs: { value: 'expense' }, text: 'expense' }),
    el('option', { attrs: { value: 'adjust' }, text: 'adjust (jika ada)' }),
  )

  const statusSel = el('select', {},
    el('option', { attrs: { value: 'active' }, text: 'active (default)' }),
    el('option', { attrs: { value: 'void' }, text: 'void' }),
    el('option', { attrs: { value: 'deleted' }, text: 'deleted' }),
    el('option', { attrs: { value: '' }, text: 'semua status' }),
  )

  const applyBtn = el('button', { attrs: { type: 'button' } }, 'Terapkan')
  const resetBtn = el('button', { attrs: { type: 'button' } }, 'Reset')

  function getValues() {
    return {
      startDate: startInput.value || '',
      endDate: endInput.value || '',
      walletId: walletSel.value || '',
      categoryId: catSel.value || '',
      type: typeSel.value || '',
      status: statusSel.value || '',
    }
  }

  function reset() {
    startInput.value = ''
    endInput.value = ''
    walletSel.value = ''
    catSel.value = ''
    typeSel.value = ''
    statusSel.value = initialStatus
  }

  reset()

  const root = el('div', { attrs: { style: 'display:grid; gap:10px; margin-top:12px;' } },
    el('div', { attrs: { style: 'display:grid; grid-template-columns:1fr 1fr; gap:10px;' } },
      field('Mulai', startInput),
      field('Sampai', endInput),
    ),
    field('Dompet', walletSel),
    field('Kategori', catSel),
    el('div', { attrs: { style: 'display:grid; grid-template-columns:1fr 1fr; gap:10px;' } },
      field('Tipe', typeSel),
      field('Status', statusSel),
    ),
    el('div', { attrs: { style: 'display:flex; gap:10px;' } },
      applyBtn,
      resetBtn
    )
  )

  function onApply(fn) {
    applyBtn.addEventListener('click', () => fn(getValues()))
  }

  function onReset(fn) {
    resetBtn.addEventListener('click', () => {
      reset()
      fn(getValues())
    })
  }

  return { root, getValues, reset, onApply, onReset }
}
