function vErr(details) {
  const e = new Error('Validation')
  e.code = 'VALIDATION'
  e.details = details
  return e
}

function parseIntStrict(val, field, { allowZero = false } = {}) {
  const s = String(val ?? '').trim()
  if (!/^\d+$/.test(s)) throw vErr([`${field} harus angka bulat (tanpa minus/desimal)`])
  const n = Number(s)
  if (!Number.isSafeInteger(n)) throw vErr([`${field} tidak valid`])
  if (allowZero) {
    if (n < 0) throw vErr([`${field} tidak boleh minus`])
  } else {
    if (n <= 0) throw vErr([`${field} harus > 0`])
  }
  return n
}

/**
 * makeTransfer menghasilkan 2-3 transaksi:
 * - out (expense) dari from -> to
 * - in (income)  ke to dari from
 * - fee (expense) optional dari from
 *
 * options.groupId (optional): untuk edit transfer agar group_id tetap sama
 */
export function makeTransfer(input, { deviceId, feeCategoryId = null, groupId = null } = {}) {
  const details = []
  if (!input?.from_wallet_id) details.push('from_wallet_id wajib')
  if (!input?.to_wallet_id) details.push('to_wallet_id wajib')
  if (input?.from_wallet_id && input?.to_wallet_id && input.from_wallet_id === input.to_wallet_id) {
    details.push('dompet asal & tujuan harus berbeda')
  }

  const occurred_at_ms = Number(input?.occurred_at_ms ?? Date.now())
  if (!Number.isFinite(occurred_at_ms)) details.push('occurred_at_ms tidak valid')

  if (details.length) throw vErr(details)

  const amount = parseIntStrict(input.amount, 'amount', { allowZero: false })
  const fee_amount = parseIntStrict(input.fee_amount ?? 0, 'fee_amount', { allowZero: true })

  const gid = groupId || crypto.randomUUID()
  const note = String(input.note || '')

  const base = {
    status: 'active',
    replaced_transaction_id: null,
    created_at_ms: Date.now(),
    updated_at_ms: Date.now(),
    device_id: deviceId ?? null,
    occurred_at_ms,
    note,
    group_id: gid,
    group_type: 'transfer',
  }

  const outTx = {
    ...base,
    id: crypto.randomUUID(),
    type: 'expense',
    wallet_id: input.from_wallet_id,
    related_wallet_id: input.to_wallet_id,
    category_id: null,
    group_role: 'out',
    amount,
  }

  const inTx = {
    ...base,
    id: crypto.randomUUID(),
    type: 'income',
    wallet_id: input.to_wallet_id,
    related_wallet_id: input.from_wallet_id,
    category_id: null,
    group_role: 'in',
    amount,
  }

  const txs = [outTx, inTx]

  if (fee_amount > 0) {
    txs.push({
      ...base,
      id: crypto.randomUUID(),
      type: 'expense',
      wallet_id: input.from_wallet_id,
      related_wallet_id: null,
      category_id: feeCategoryId ?? null,
      group_role: 'fee',
      amount: fee_amount,
      note: note ? `${note} (fee)` : '(fee)',
    })
  }

  return txs
}
