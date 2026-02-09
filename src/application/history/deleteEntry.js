import { getTransaction, markTransactionDeleted, markGroupDeleted } from '../../infra/repos/transactionRepo.js'

export async function deleteEntry(anyTxId) {
  const tx = await getTransaction(anyTxId)
  if (!tx) return

  if (tx.group_id) {
    await markGroupDeleted(tx.group_id)
    return
  }

  await markTransactionDeleted(anyTxId)
}
