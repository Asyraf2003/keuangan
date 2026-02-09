import { listTransactionsByOccurredRange } from '../../infra/repos/transactionRepo.js'

function isTransferMovement(tx) {
  // out/in = movement; fee = expense nyata
  return !!tx.group_id && (tx.group_role === 'out' || tx.group_role === 'in')
}

function toInt(n) {
  const x = Number(n || 0)
  return Number.isFinite(x) ? x : 0
}

export async function getReport({
  startMs,
  endMs,
  walletId = null,
  categoryId = null,
  txType = 'all', // all|income|expense
  includeTransferMovements = false,
} = {}) {
  const items = await listTransactionsByOccurredRange({ startMs, endMs })

  // laporan = transaksi active saja
  let txs = items.filter(t => t.status === 'active')

  if (!includeTransferMovements) {
    txs = txs.filter(t => !isTransferMovement(t))
  }

  if (walletId) txs = txs.filter(t => t.wallet_id === walletId)
  if (categoryId) txs = txs.filter(t => (t.category_id || null) === categoryId)

  if (txType === 'income') txs = txs.filter(t => t.type === 'income')
  if (txType === 'expense') txs = txs.filter(t => t.type === 'expense')

  let totalIncome = 0
  let totalExpense = 0

  const byWallet = new Map() // wallet_id -> { income, expense }
  const byCategory = new Map() // category_id|null -> { income, expense }

  for (const t of txs) {
    const amt = toInt(t.amount)
    if (t.type === 'income') totalIncome += amt
    if (t.type === 'expense') totalExpense += amt

    const w = byWallet.get(t.wallet_id) || { income: 0, expense: 0 }
    if (t.type === 'income') w.income += amt
    if (t.type === 'expense') w.expense += amt
    byWallet.set(t.wallet_id, w)

    const key = t.category_id || null
    const c = byCategory.get(key) || { income: 0, expense: 0 }
    if (t.type === 'income') c.income += amt
    if (t.type === 'expense') c.expense += amt
    byCategory.set(key, c)
  }

  const net = totalIncome - totalExpense

  // sort helpers
  const byWalletArr = [...byWallet.entries()].map(([wallet_id, v]) => ({ wallet_id, ...v }))
  const byCategoryArr = [...byCategory.entries()].map(([category_id, v]) => ({ category_id, ...v }))

  byWalletArr.sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
  byCategoryArr.sort((a, b) => (b.income + b.expense) - (a.income + a.expense))

  return {
    meta: { startMs, endMs, walletId, categoryId, txType, includeTransferMovements },
    totals: { income: totalIncome, expense: totalExpense, net },
    breakdown: { byWallet: byWalletArr, byCategory: byCategoryArr },
    count: txs.length,
  }
}
