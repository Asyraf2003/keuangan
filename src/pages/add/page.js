import { clear, el } from '../../shared/dom.js'
import { listWallets } from '../../infra/repos/walletRepo.js'
import { listCategories } from '../../infra/repos/categoryRepo.js'
import { getMeta } from '../../infra/repos/metaRepo.js'
import { getTransaction, listTransactionsByGroupId } from '../../infra/repos/transactionRepo.js'

import { nowMs } from '../../domain/time.js'
import { toDateInputValue, fromDateInputValue } from '../../domain/dateInput.js'

import { field } from '../../ui/components/field.js'

import { createIncomeExpense } from '../../application/transactions/createIncomeExpense.js'
import { createTransfer as createTransferUC } from '../../application/transactions/createTransfer.js'
import { voidAndReplace } from '../../application/transactions/voidAndReplace.js'
import { voidAndReplaceTransfer } from '../../application/transactions/voidAndReplaceTransfer.js'

function pickRoleActive(list, role) {
  return (list || []).find(x => x.status === 'active' && x.group_role === role) || null
}

export function renderAdd(outlet, ctx) {
  clear(outlet)

  const modeQ = ctx?.query?.mode || null // income | expense | transfer
  const editId = ctx?.query?.edit || null

  const wrap = el('div', { class: 'card' },
    el('h1', { class: 'h1', text: 'Tambah' }),
    el('p', { class: 'p', text: 'Loading form…' }),
  )
  outlet.append(wrap)

  ;(async () => {
    const [wallets, categories, deviceId] = await Promise.all([
      listWallets(),
      listCategories(),
      getMeta('device_id'),
    ])

    const incomeCats = categories.filter(c => c.type === 'income' && c.status === 'active')
    const expenseCats = categories.filter(c => c.type === 'expense' && c.status === 'active')

    const feeCat = categories.find(c =>
      c.type === 'expense' &&
      c.status === 'active' &&
      ['lainnya', 'biaya lainnya'].includes(String(c.name).trim().toLowerCase())
    ) || null

    // ===== Transfer mode (create + edit group) =====
    if (modeQ === 'transfer') {
      let old = null
      let oldGroup = null

      if (editId) {
        old = await getTransaction(editId)
        if (!old || old.group_type !== 'transfer' || !old.group_id) {
          wrap.replaceChildren(
            el('h1', { class: 'h1', text: 'Transfer' }),
            el('p', { class: 'p', text: 'Transaksi transfer tidak ditemukan.' })
          )
          return
        }

        // anti “kecolongan”: jangan bisa edit dari leg in/fee walau user ngoprek URL
        if (old.group_role !== 'out') {
          wrap.replaceChildren(
            el('h1', { class: 'h1', text: 'Transfer' }),
            el('p', { class: 'p', text: 'Edit transfer hanya boleh dari leg utama (out).' })
          )
          return
        }

        oldGroup = await listTransactionsByGroupId(old.group_id)
      }

      wrap.replaceChildren(
        el('h1', { class: 'h1', text: editId ? 'Edit Transfer' : 'Transfer' }),
        el('p', { class: 'p', text: 'Transfer adalah 1 event (out/in/fee). Edit = void paket lama + buat paket baru.' }),
        renderTransferForm({ wallets, deviceId, feeCategoryId: feeCat?.id ?? null, editId, oldGroup })
      )
      return
    }

    // ===== Edit load (income/expense only) =====
    let oldTx = null
    if (editId) {
      oldTx = await getTransaction(editId)
      if (!oldTx) {
        wrap.replaceChildren(
          el('h1', { class: 'h1', text: 'Edit' }),
          el('p', { class: 'p', text: 'Transaksi tidak ditemukan.' })
        )
        return
      }
      if (oldTx.group_type === 'transfer') {
        wrap.replaceChildren(
          el('h1', { class: 'h1', text: 'Edit' }),
          el('p', { class: 'p', text: 'Edit transfer harus via mode transfer (group). Harusnya kamu ga nyasar ke sini.' })
        )
        return
      }
      if (oldTx.type !== 'income' && oldTx.type !== 'expense') {
        wrap.replaceChildren(
          el('h1', { class: 'h1', text: 'Edit' }),
          el('p', { class: 'p', text: 'Hanya income/expense yang bisa diedit saat ini.' })
        )
        return
      }
    }

    const effectiveMode = editId ? oldTx.type : (modeQ === 'expense' ? 'expense' : 'income')
    const title = editId
      ? `Edit (${effectiveMode})`
      : (effectiveMode === 'expense' ? 'Kurang (Expense)' : 'Tambah (Income)')

    const walletSelect = el('select', { attrs: { required: 'true', name: 'wallet_id' } },
      ...wallets.map(w => el('option', { attrs: { value: w.id }, text: w.name }))
    )

    const catSelect = el('select', { attrs: { name: 'category_id' } })
    const amountInput = el('input', {
      attrs: { name: 'amount', inputmode: 'numeric', placeholder: 'Amount (integer)', required: 'true' }
    })
    const noteInput = el('input', { attrs: { name: 'note', placeholder: 'Catatan (opsional)' } })
    const dateInput = el('input', {
      attrs: { name: 'occurred_date', type: 'date', required: 'true', value: toDateInputValue(nowMs()) }
    })
    const statusLine = el('p', { class: 'p', text: '' })

    function fillCategories(list) {
      catSelect.replaceChildren(
        el('option', { attrs: { value: '' }, text: '(Tanpa kategori)' }),
        ...list.map(c => el('option', { attrs: { value: c.id }, text: c.name }))
      )
    }

    if (effectiveMode === 'expense') fillCategories(expenseCats)
    else fillCategories(incomeCats)

    // Prefill on edit
    if (editId && oldTx) {
      walletSelect.value = oldTx.wallet_id
      catSelect.value = oldTx.category_id || ''
      amountInput.value = String(oldTx.amount ?? '')
      noteInput.value = String(oldTx.note || '')
      dateInput.value = toDateInputValue(oldTx.occurred_at_ms)
    }

    const form = el('form', {
      onsubmit: async (e) => {
        e.preventDefault()
        statusLine.textContent = ''

        try {
          const payload = {
            wallet_id: walletSelect.value,
            category_id: catSelect.value || null,
            type: effectiveMode,
            amount: amountInput.value,
            note: noteInput.value,
            occurred_at_ms: fromDateInputValue(dateInput.value),
          }

          if (editId) {
            await voidAndReplace(editId, payload, { deviceId })
          } else {
            await createIncomeExpense(payload, { deviceId })
          }

          location.hash = '#/history'
        } catch (err) {
          console.error(err)
          if (err?.code === 'VALIDATION') statusLine.textContent = `Validasi gagal: ${err.details.join(', ')}`
          else statusLine.textContent = 'Gagal simpan. Cek console.'
        }
      }
    },
      editId
        ? el('p', { class: 'p', text: 'Edit membuat event baru: transaksi lama jadi void, transaksi baru jadi active.' })
        : (modeQ ? null : el('p', { class: 'p', text: 'Tip: pakai tombol + / − / 0 di FAB bawah biar mode-nya jelas.' })),
      field('Dompet', walletSelect),
      field('Kategori', catSelect),
      field('Tanggal kejadian', dateInput),
      field('Amount', amountInput),
      field('Catatan', noteInput),
      el('button', { attrs: { type: 'submit' } }, editId ? 'Simpan Perubahan (void+new)' : `Simpan (${title})`),
      statusLine
    )

    wrap.replaceChildren(
      el('h1', { class: 'h1', text: title }),
      el('p', { class: 'p', text: 'Amount selalu positif. Expense mengurangi saldo lewat perhitungan.' }),
      form
    )
  })().catch((e) => {
    console.error(e)
    wrap.replaceChildren(
      el('h1', { class: 'h1', text: 'Tambah' }),
      el('p', { class: 'p', text: 'Gagal load form. Cek console.' })
    )
  })
}

function renderTransferForm({ wallets, deviceId, feeCategoryId, editId, oldGroup }) {
  const oldOut = pickRoleActive(oldGroup, 'out')
  const oldIn = pickRoleActive(oldGroup, 'in')
  const oldFee = pickRoleActive(oldGroup, 'fee')

  const fromSel = el('select', { attrs: { required: 'true' } },
    ...wallets.map(w => el('option', { attrs: { value: w.id }, text: w.name }))
  )

  const toSel = el('select', { attrs: { required: 'true' } },
    ...wallets.map(w => el('option', { attrs: { value: w.id }, text: w.name }))
  )

  const amountInput = el('input', { attrs: { inputmode: 'numeric', placeholder: 'Amount', required: 'true' } })
  const feeInput = el('input', { attrs: { inputmode: 'numeric', placeholder: 'Fee (opsional, default 0)' } })
  const dateInput = el('input', { attrs: { type: 'date', required: 'true', value: toDateInputValue(nowMs()) } })
  const noteInput = el('input', { attrs: { placeholder: 'Catatan (opsional)' } })
  const statusLine = el('p', { class: 'p', text: '' })

  // default create: preselect dompet ke-2 kalau ada
  if (!editId && wallets.length >= 2) toSel.value = wallets[1].id
  feeInput.value = '0'

  // prefill edit: ambil dari leg active
  if (editId && oldOut && oldIn) {
    fromSel.value = oldOut.wallet_id
    toSel.value = oldIn.wallet_id
    amountInput.value = String(oldOut.amount ?? '')
    feeInput.value = String(oldFee?.amount ?? 0)
    dateInput.value = toDateInputValue(oldOut.occurred_at_ms)
    noteInput.value = String(oldOut.note || '')
  }

  return el('form', {
    onsubmit: async (e) => {
      e.preventDefault()
      statusLine.textContent = ''

      try {
        const payload = {
          from_wallet_id: fromSel.value,
          to_wallet_id: toSel.value,
          amount: amountInput.value,
          fee_amount: feeInput.value || 0,
          occurred_at_ms: fromDateInputValue(dateInput.value),
          note: noteInput.value,
        }

        if (editId) {
          await voidAndReplaceTransfer(editId, payload, { deviceId, feeCategoryId: feeCategoryId ?? null })
        } else {
          await createTransferUC(payload, { deviceId, feeCategoryId: feeCategoryId ?? null })
        }

        location.hash = '#/history'
      } catch (err) {
        console.error(err)
        if (err?.code === 'VALIDATION') statusLine.textContent = `Validasi gagal: ${err.details.join(', ')}`
        else statusLine.textContent = 'Gagal simpan. Cek console.'
      }
    }
  },
    field('Dari dompet', fromSel),
    field('Ke dompet', toSel),
    field('Tanggal kejadian', dateInput),
    field('Amount', amountInput),
    field('Fee (opsional)', feeInput),
    field('Catatan', noteInput),
    el('button', { attrs: { type: 'submit' } }, editId ? 'Simpan Edit Transfer (void+new)' : 'Simpan Transfer'),
    statusLine
  )
}
