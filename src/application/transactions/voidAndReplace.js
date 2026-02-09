import { makeTransaction } from '../../domain/transactions.js'
import { getTransaction, voidAndCreateTransaction } from '../../infra/repos/transactionRepo.js'
import { getActiveBalancesMap, simulateBalances, assertNoNegative } from '../balance/activeBalances.js'

export async function voidAndReplace(oldTxId, input, { deviceId }) {
  const oldTx = await getTransaction(oldTxId)
  if (!oldTx) {
    const e = new Error('Validation')
    e.code = 'VALIDATION'
    e.details = ['transaksi lama tidak ditemukan']
    throw e
  }
  if (oldTx.status !== 'active') {
    const e = new Error('Validation')
    e.code = 'VALIDATION'
    e.details = ['hanya transaksi active yang bisa diedit']
    throw e
  }

  const newTx = makeTransaction(input, { deviceId })
  newTx.replaced_transaction_id = oldTxId

  const base = await getActiveBalancesMap()
  const next = simulateBalances(base, { remove: [oldTx], add: [newTx] })

  const impacted = new Set([oldTx.wallet_id, newTx.wallet_id])
  assertNoNegative(next, [...impacted], 'Saldo dompet')

  await voidAndCreateTransaction(oldTxId, newTx)
  return newTx
}
