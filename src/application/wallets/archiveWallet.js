import { archiveWallet as archiveWalletRepo } from '../../infra/repos/walletRepo.js'

export async function archiveWallet(id) {
  return archiveWalletRepo(id)
}
