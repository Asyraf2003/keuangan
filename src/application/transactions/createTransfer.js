import { makeTransfer } from '../../domain/transfer.js'
import { createTransactionsBatch } from '../../infra/repos/transactionRepo.js'
import { getActiveBalancesMap } from '../balance/activeBalances.js'

function vErr(details) {
  const e = new Error('Validation')
  e.code = 'VALIDATION'
  e.details = details
  return e
}

function parseIntStrict(val, field, { allowZero = false } = {}) {
  const s = String(val ?? '').trim()
  if (!s) throw vErr([`${field} wajib diisi`])
  if (!/^\d+$/.test(s)) throw vErr([`${field} harus angka bulat positif (tanpa minus/desimal)`])
  const n = Number(s)
  if (!Number.isFinite(n)) throw vErr([`${field} tidak valid`])
  if (!allowZero && n <= 0) throw vErr([`${field} harus > 0`])
  if (allowZero && n < 0) throw vErr([`${field} tidak boleh < 0`])
  return n
}

export async function createTransfer(input, { deviceId, feeCategoryId = null } = {}) {
  const amount = parseIntStrict(input.amount, 'amount', { allowZero: false })
  const fee = parseIntStrict(input.fee_amount ?? 0, 'fee_amount', { allowZero: true })

  const balMap = await getActiveBalancesMap()
  const current = balMap.get(input.from_wallet_id) || 0
  const need = amount + fee

  if (current - need < 0) {
    throw vErr([`saldo pengirim tidak cukup. tersedia ${current}, butuh ${need}`])
  }

  const txs = makeTransfer(input, { deviceId, feeCategoryId })
  await createTransactionsBatch(txs)
  return txs
}
