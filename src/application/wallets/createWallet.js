import { createWallet as createWalletRepo } from '../../infra/repos/walletRepo.js'
export async function createWallet({ name, color = null, icon = null }) {
  return createWalletRepo({ name, color, icon })
}
