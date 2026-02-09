import { listWallets } from '../../infra/repos/walletRepo.js'

export async function getWallets({ includeArchived = false } = {}) {
  const items = await listWallets({ includeArchived })
  return { items }
}
