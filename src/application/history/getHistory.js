import { listTransactionsByOccurredRange } from '../../infra/repos/transactionRepo.js'
import { nowMs } from '../../domain/time.js'
import { fromDateInputValue } from '../../domain/dateInput.js'

export async function getHistory(filters) {
  const startMs = filters.startDate ? fromDateInputValue(filters.startDate) : 0
  const endMs = filters.endDate
    ? (fromDateInputValue(filters.endDate) + (24 * 60 * 60 * 1000 - 1))
    : nowMs()

  const raw = await listTransactionsByOccurredRange({ startMs, endMs })

  const w = filters.walletId || null
  const c = filters.categoryId || null
  const t = filters.type || null
  const s = filters.status || null

  const items = raw.filter(tx => {
    if (w && tx.wallet_id !== w) return false
    if (c && tx.category_id !== c) return false
    if (t && tx.type !== t) return false
    if (s && tx.status !== s) return false
    return true
  })

  return { items }
}
