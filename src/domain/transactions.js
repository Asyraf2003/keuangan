function vErr(details) {
  const e = new Error('Validation')
  e.code = 'VALIDATION'
  e.details = details
  return e
}

function parseIntStrict(val, field, { allowZero = false } = {}) {
  const s = String(val ?? '').trim()
  if (!/^\d+$/.test(s)) throw vErr([`${field} harus angka bulat positif (tanpa minus/desimal)`])
  const n = Number(s)
  if (!Number.isSafeInteger(n)) throw vErr([`${field} tidak valid`])
  if (allowZero) {
    if (n < 0) throw vErr([`${field} tidak boleh minus`])
  } else {
    if (n <= 0) throw vErr([`${field} harus > 0`])
  }
  return n
}

export function makeTransaction(input, { deviceId }) {
  const details = []
  if (!input?.wallet_id) details.push('wallet_id wajib')
  const type = String(input?.type || '').trim()
  if (!['income', 'expense', 'adjust'].includes(type)) details.push('type tidak valid')

  const occurred_at_ms = Number(input?.occurred_at_ms ?? Date.now())
  if (!Number.isFinite(occurred_at_ms)) details.push('occurred_at_ms tidak valid')

  if (details.length) throw vErr(details)

  const amount = parseIntStrict(input.amount, 'amount', { allowZero: false })

  return {
    id: crypto.randomUUID(),
    wallet_id: input.wallet_id,
    category_id: input.category_id ?? null,
    type,
    amount,
    note: String(input.note || ''),
    occurred_at_ms,

    status: 'active',
    replaced_transaction_id: input.replaced_transaction_id ?? null,

    created_at_ms: Date.now(),
    updated_at_ms: Date.now(),
    device_id: deviceId ?? null,

    // transfer/group fields (default null)
    group_id: input.group_id ?? null,
    group_type: input.group_type ?? null,
    group_role: input.group_role ?? null,
    related_wallet_id: input.related_wallet_id ?? null,
  }
}
