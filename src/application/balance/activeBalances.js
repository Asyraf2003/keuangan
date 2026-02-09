import { listActiveTransactions } from '../../infra/repos/transactionRepo.js'

function vErr(details) {
  const e = new Error('Validation')
  e.code = 'VALIDATION'
  e.details = details
  return e
}

function deltaOf(tx) {
  const amt = Number(tx.amount || 0)
  if (tx.type === 'income') return +amt
  if (tx.type === 'expense') return -amt
  // adjust sebaiknya diwakili income/expense. Untuk sementara treat sebagai income.
  if (tx.type === 'adjust') return +amt
  return 0
}

function applyDelta(map, walletId, delta) {
  map.set(walletId, (map.get(walletId) || 0) + delta)
}

export async function getActiveBalancesMap() {
  const txs = await listActiveTransactions()
  const m = new Map()
  for (const tx of txs) {
    applyDelta(m, tx.wallet_id, deltaOf(tx))
  }
  return m
}

export function simulateBalances(baseMap, { remove = [], add = [] }) {
  const m = new Map(baseMap)

  for (const tx of remove) {
    applyDelta(m, tx.wallet_id, -deltaOf(tx))
  }
  for (const tx of add) {
    applyDelta(m, tx.wallet_id, +deltaOf(tx))
  }

  return m
}

export function assertNoNegative(map, walletIds, label = 'saldo') {
  const bad = []
  for (const wid of walletIds) {
    const bal = map.get(wid) || 0
    if (bal < 0) bad.push(`${wid} (${bal})`)
  }
  if (bad.length) throw vErr([`${label} tidak boleh minus: ${bad.join(', ')}`])
}
