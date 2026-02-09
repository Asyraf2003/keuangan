// src/domain/balance.js
export function calcBalances({ wallets, transactions }) {
  const byWallet = new Map()
  for (const w of wallets) {
    byWallet.set(w.id, { wallet: w, balance: 0 })
  }

  for (const tx of transactions) {
    // safety: kalau ada data lama/aneh
    if (tx.status !== 'active') continue

    const slot = byWallet.get(tx.wallet_id)
    if (!slot) continue

    const amt = Number(tx.amount) || 0
    let delta = 0

    if (tx.type === 'income') delta = amt
    else if (tx.type === 'expense') delta = -amt
    else if (tx.type === 'adjust') {
      // kalau suatu hari adjust hidup lagi di dompet/akun
      delta = (tx.adjust_direction === 'decrease') ? -amt : amt
    }

    slot.balance += delta
  }

  const perWallet = Array.from(byWallet.values())
  const total = perWallet.reduce((s, x) => s + x.balance, 0)
  return { total, perWallet }
}
