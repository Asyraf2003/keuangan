import { markTransactionDeleted } from '../../infra/repos/transactionRepo.js'

export async function deleteTransaction(id) {
  await markTransactionDeleted(id)
}
