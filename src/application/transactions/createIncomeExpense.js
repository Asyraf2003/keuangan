import { makeTransaction } from '../../domain/transactions.js'
import { createTransaction } from '../../infra/repos/transactionRepo.js'
import { getActiveBalancesMap, simulateBalances, assertNoNegative } from '../balance/activeBalances.js'

export async function createIncomeExpense(input, { deviceId }) {
  const tx = makeTransaction(input, { deviceId })

  // hanya expense yang berpotensi bikin minus
  if (tx.type === 'expense') {
    const base = await getActiveBalancesMap()
    const next = simulateBalances(base, { add: [tx] })
    assertNoNegative(next, [tx.wallet_id], 'Saldo dompet')
  }

  await createTransaction(tx)
  return tx
}
