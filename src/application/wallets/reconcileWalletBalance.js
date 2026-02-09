import { nowMs } from '../../domain/time.js'
import { listCategories } from '../../infra/repos/categoryRepo.js'
import { createIncomeExpense } from '../transactions/createIncomeExpense.js'
import { getActiveBalancesMap } from '../balance/activeBalances.js'

function vErr(details) {
  const e = new Error('Validation')
  e.code = 'VALIDATION'
  e.details = details
  return e
}

function parseNonNegativeInt(val, field) {
  const s = String(val ?? '').trim()
  if (!/^\d+$/.test(s)) throw vErr([`${field} harus angka bulat >= 0`])
  const n = Number(s)
  if (!Number.isSafeInteger(n) || n < 0) throw vErr([`${field} tidak valid`])
  return n
}

function fmt(n) {
  return new Intl.NumberFormat('id-ID').format(n)
}

async function pickExpenseMiscCategoryId() {
  const cats = await listCategories({ includeArchived: true })
  const c = cats.find(x =>
    x.status === 'active' &&
    x.type === 'expense' &&
    ['lainnya', 'biaya lainnya'].includes(String(x.name).trim().toLowerCase())
  )
  return c?.id ?? null
}

export async function reconcileWalletBalance({ walletId, targetBalance, note }, { deviceId }) {
  const target = parseNonNegativeInt(targetBalance, 'saldo target')

  const base = await getActiveBalancesMap()
  const current = base.get(walletId) || 0

  if (target === current) {
    return { ok: true, message: 'Saldo sudah sama. Tidak ada transaksi dibuat.' }
  }

  const delta = target - current
  const type = delta > 0 ? 'income' : 'expense'
  const amount = Math.abs(delta)

  const expenseMiscCategoryId = await pickExpenseMiscCategoryId()

  const txInput = {
    wallet_id: walletId,
    category_id: (type === 'expense') ? expenseMiscCategoryId : null,
    type,
    amount: String(amount),
    note: note || `Reconcile saldo: ${fmt(current)} → ${fmt(target)}`,
    occurred_at_ms: nowMs(),
  }

  // createIncomeExpense sudah punya guard no-minus untuk expense
  await createIncomeExpense(txInput, { deviceId })
  return { ok: true, message: `Reconcile dibuat (${type} ${fmt(amount)}).` }
}
