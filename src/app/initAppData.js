// src/app/initAppData.js
import { ensureMeta } from '../infra/repos/metaRepo.js'
import { newId } from '../domain/id.js'

import { listWallets, createWallet } from '../infra/repos/walletRepo.js'
import { listCategories, createCategory } from '../infra/repos/categoryRepo.js'

import { makeWallet, makeCategory } from '../domain/factories.js'

export async function initAppData() {
  const deviceId = await ensureMeta('device_id', () => newId())

  // ---- Wallet defaults (ensure) ----
  const defaultWalletNames = ['Cash', 'E-Wallet', 'Tabungan', 'Bank']
  const wallets = await listWallets()
  const walletNames = new Set(wallets.map(w => String(w.name).trim().toLowerCase()))

  for (const name of defaultWalletNames) {
    const key = name.toLowerCase()
    if (!walletNames.has(key)) {
      await createWallet(makeWallet({ name }))
    }
  }

  // ---- Category defaults (ensure) ----
  const defaultCategories = [
    { name: 'Gaji', type: 'income' },

    { name: 'Belanja', type: 'expense' },
    { name: 'Kesehatan', type: 'expense' },
    { name: 'Pakaian', type: 'expense' },
    { name: 'Makanan', type: 'expense' },
    { name: 'Hiburan', type: 'expense' },
    { name: 'Hadiah', type: 'expense' },
    { name: 'Transportasi', type: 'expense' },
    { name: 'Lainnya', type: 'expense' }, // untuk fee admin + misc + (nanti) penyesuaian saldo
  ]

  const cats = await listCategories()
  const catKeys = new Set(
    cats.map(c => `${String(c.type)}::${String(c.name).trim().toLowerCase()}`)
  )

  for (const c of defaultCategories) {
    const k = `${c.type}::${c.name.toLowerCase()}`
    if (!catKeys.has(k)) {
      await createCategory(makeCategory(c))
    }
  }

  return { deviceId }
}
