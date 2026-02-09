import { makeTransfer } from '../../domain/transfer.js'
import { getTransaction, listTransactionsByGroupId, voidGroupAndCreateBatch } from '../../infra/repos/transactionRepo.js'
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

export async function voidAndReplaceTransfer(editTxId, input, { deviceId, feeCategoryId = null } = {}) {
  const anyOld = await getTransaction(editTxId)
  if (!anyOld || anyOld.group_type !== 'transfer' || !anyOld.group_id) {
    const e = vErr(['transfer group_id tidak ditemukan'])
    throw e
  }

  const oldGroup = await listTransactionsByGroupId(anyOld.group_id)
  const oldOut = oldGroup.find(x => x.group_role === 'out') || null
  const oldIn = oldGroup.find(x => x.group_role === 'in') || null
  const oldFee = oldGroup.find(x => x.group_role === 'fee') || null

  // ===== anti minus (terbatas di pengirim) =====
  const amount = parseIntStrict(input.amount, 'amount', { allowZero: false })
  const fee = parseIntStrict(input.fee_amount ?? 0, 'fee_amount', { allowZero: true })

  const balMap = await getActiveBalancesMap()
  const current = balMap.get(input.from_wallet_id) || 0

  // kalau pengirim sama dengan old pengirim, expense lama dianggap "dikembalikan" karena akan di-void
  const refundable =
    (oldOut && oldOut.wallet_id === input.from_wallet_id && oldOut.status === 'active' ? Number(oldOut.amount || 0) : 0) +
    (oldFee && oldFee.wallet_id === input.from_wallet_id && oldFee.status === 'active' ? Number(oldFee.amount || 0) : 0)

  const available = current + refundable
  const need = amount + fee
  if (available - need < 0) {
    throw vErr([`saldo pengirim tidak cukup. tersedia ${available}, butuh ${need}`])
  }

  // ===== bikin paket baru (group_id baru) =====
  const newTxs = makeTransfer(input, { deviceId, feeCategoryId })

  // link replaced_transaction_id per leg (biar jelas ini "edit", bukan rewrite)
  for (const tx of newTxs) {
    if (tx.group_role === 'out' && oldOut) tx.replaced_transaction_id = oldOut.id
    if (tx.group_role === 'in' && oldIn) tx.replaced_transaction_id = oldIn.id
    if (tx.group_role === 'fee' && oldFee) tx.replaced_transaction_id = oldFee.id
  }

  const oldActiveIds = oldGroup.filter(x => x.status === 'active').map(x => x.id)
  await voidGroupAndCreateBatch(oldActiveIds, newTxs)

  return { ok: true, old_group_id: anyOld.group_id, new_group_id: newTxs[0]?.group_id }
}
