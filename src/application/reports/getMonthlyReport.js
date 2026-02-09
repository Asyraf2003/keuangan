import { listTransactionsByOccurredRange } from '../../infra/repos/transactionRepo.js'

function isTransferMovement(tx) {
  return !!tx.group_id && (tx.group_role === 'out' || tx.group_role === 'in')
}

function toInt(n) {
  const x = Number(n || 0)
  return Number.isFinite(x) ? x : 0
}

function monthKey(ms) {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export async function getMonthlyReport({
  startMs,
  endMs,
  walletId = null,
  categoryId = null,
  txType = 'all', // all|income|expense
  includeTransferMovements = false,
} = {}) {
  const items = await listTransactionsByOccurredRange({ startMs, endMs })
  let txs = items.filter(t => t.status === 'active')

  if (!includeTransferMovements) {
    txs = txs.filter(t => !isTransferMovement(t))
  }

  if (walletId) txs = txs.filter(t => t.wallet_id === walletId)
  if (categoryId !== undefined && categoryId !== null) {
    txs = txs.filter(t => (t.category_id || null) === categoryId)
  }

  if (txType === 'income') txs = txs.filter(t => t.type === 'income')
  if (txType === 'expense') txs = txs.filter(t => t.type === 'expense')

  // monthly buckets
  const buckets = new Map() // key -> { income, expense, count }
  // top expense categories overall (range)
  const expenseByCat = new Map() // category_id|null -> totalExpense

  for (const t of txs) {
    const k = monthKey(t.occurred_at_ms)
    const b = buckets.get(k) || { income: 0, expense: 0, count: 0 }

    const amt = toInt(t.amount)
    if (t.type === 'income') b.income += amt
    if (t.type === 'expense') {
      b.expense += amt
      const ck = t.category_id || null
      expenseByCat.set(ck, (expenseByCat.get(ck) || 0) + amt)
    }

    b.count += 1
    buckets.set(k, b)
  }

  const months = [...buckets.entries()]
    .map(([key, v]) => ({ month: key, income: v.income, expense: v.expense, net: v.income - v.expense, count: v.count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const topExpenseCategories = [...expenseByCat.entries()]
    .map(([category_id, totalExpense]) => ({ category_id, totalExpense }))
    .sort((a, b) => b.totalExpense - a.totalExpense)
    .slice(0, 10)

  // totals
  let totalIncome = 0
  let totalExpense = 0
  let totalCount = 0
  for (const m of months) {
    totalIncome += m.income
    totalExpense += m.expense
    totalCount += m.count
  }

  return {
    meta: { startMs, endMs, walletId, categoryId, txType, includeTransferMovements },
    totals: { income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense },
    months,
    topExpenseCategories,
    count: totalCount,
  }
}
