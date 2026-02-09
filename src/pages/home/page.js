import { clear, el } from '../../shared/dom.js'
import { listWallets } from '../../infra/repos/walletRepo.js'
import { listActiveTransactions } from '../../infra/repos/transactionRepo.js'
import { calcBalances } from '../../domain/balance.js'

export function renderHome(outlet) {
  clear(outlet)

  const wrap = el('div', { class: 'card' },
    el('h1', { class: 'h1', text: 'Home' }),
    el('p', { class: 'p', text: 'Loading saldo…' }),
  )
  outlet.append(wrap)

  ;(async () => {
    const [wallets, txs] = await Promise.all([
      listWallets(),
      listActiveTransactions(),
    ])

    const { total, perWallet } = calcBalances({ wallets, transactions: txs })
    const fmt = (n) => new Intl.NumberFormat('id-ID').format(n)

    wrap.replaceChildren(
      el('h1', { class: 'h1', text: 'Home' }),
      el('p', { class: 'p', text: `Saldo total: ${fmt(total)}` }),
      el('div', { attrs: { style: 'display:grid; gap:10px; margin-top:12px;' } },
        ...perWallet.map(({ wallet, balance }) =>
          el('div', { class: 'card', attrs: { style: 'padding:10px;' } },
            el('div', { attrs: { style: 'font-size:12px; color:#555;' }, text: wallet.name }),
            el('div', { attrs: { style: 'font-size:16px; font-weight:700; margin-top:4px;' }, text: fmt(balance) }),
          )
        )
      )
    )
  })().catch((e) => {
    console.error(e)
    wrap.replaceChildren(
      el('h1', { class: 'h1', text: 'Home' }),
      el('p', { class: 'p', text: 'Gagal hitung saldo. Cek console.' })
    )
  })
}
