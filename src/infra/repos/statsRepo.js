// src/infra/repos/statsRepo.js
import { db } from '../db/financeDb.js'

export async function getCounts() {
  const [wallets, categories, transactions] = await Promise.all([
    db.wallets.count(),
    db.categories.count(),
    db.transactions.count(),
  ])
  return { wallets, categories, transactions }
}
