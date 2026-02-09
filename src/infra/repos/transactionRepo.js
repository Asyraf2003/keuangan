import { db } from '../db/financeDb.js'

export async function createTransaction(tx) {
  await db.transactions.add(tx)
  return tx
}

export async function createTransactionsBatch(txs) {
  await db.transaction('rw', db.transactions, async () => {
    await db.transactions.bulkAdd(txs)
  })
  return txs
}

export async function listTransactions({ limit = 20 } = {}) {
  return db.transactions
    .orderBy('occurred_at_ms')
    .reverse()
    .limit(limit)
    .toArray()
}

export async function listActiveTransactions() {
  return db.transactions.where('status').equals('active').toArray()
}

export async function listTransactionsByOccurredRange({ startMs, endMs }) {
  return db.transactions
    .where('occurred_at_ms')
    .between(startMs, endMs, true, true)
    .reverse()
    .toArray()
}

export async function getTransaction(id) {
  return db.transactions.get(id)
}

export async function updateTransaction(id, changes) {
  const patch = { ...changes, updated_at_ms: Date.now() }
  await db.transactions.update(id, patch)
}

export async function markTransactionDeleted(id) {
  await updateTransaction(id, { status: 'deleted' })
}

export async function markTransactionVoid(id) {
  await updateTransaction(id, { status: 'void' })
}

export async function voidAndCreateTransaction(oldId, newTx) {
  await db.transaction('rw', db.transactions, async () => {
    await db.transactions.update(oldId, { status: 'void', updated_at_ms: Date.now() })
    await db.transactions.add(newTx)
  })
  return newTx
}

/**
 * Transfer grouping helpers
 * NOTE: pakai scan filter supaya tidak tergantung index group_id (lebih kebal).
 */
export async function listTransactionsByGroupId(groupId) {
  return db.transactions
    .filter(tx => tx.group_id === groupId)
    .toArray()
}

export async function voidTransactions(ids) {
  const t = Date.now()
  await db.transaction('rw', db.transactions, async () => {
    for (const id of ids) {
      await db.transactions.update(id, { status: 'void', updated_at_ms: t })
    }
  })
}

export async function voidGroupAndCreateBatch(oldIds, newTxs) {
  const t = Date.now()
  await db.transaction('rw', db.transactions, async () => {
    for (const id of oldIds) {
      await db.transactions.update(id, { status: 'void', updated_at_ms: t })
    }
    await db.transactions.bulkAdd(newTxs)
  })
  return newTxs
}

export async function markGroupDeleted(groupId) {
  const t = Date.now()
  await db.transaction('rw', db.transactions, async () => {
    const items = await db.transactions
      .filter(tx => tx.group_id === groupId && tx.status === 'active')
      .toArray()

    for (const tx of items) {
      await db.transactions.update(tx.id, { status: 'deleted', updated_at_ms: t })
    }
  })
}
