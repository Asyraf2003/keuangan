import { db } from '../db/financeDb.js'
import { defaultWalletAppearance, normalizeHexColor, normalizeIcon } from '../../domain/appearance.js'

function vErr(details) {
  const e = new Error('Validation')
  e.code = 'VALIDATION'
  e.details = details
  return e
}

export async function listWallets({ includeArchived = false } = {}) {
  if (includeArchived) return db.wallets.orderBy('created_at_ms').toArray()
  return db.wallets.where('status').equals('active').sortBy('created_at_ms')
}

export async function createWallet({ name, color = null, icon = null }) {
  const n = String(name ?? '').trim()
  if (!n) throw vErr(['nama dompet wajib'])

  const now = Date.now()
  const id = crypto.randomUUID()
  const def = defaultWalletAppearance(id)

  const wallet = {
    id,
    name: n,
    status: 'active',
    color: normalizeHexColor(color, def.color),
    icon: normalizeIcon(icon, def.icon),
    created_at_ms: now,
    updated_at_ms: now,
  }

  await db.wallets.add(wallet)
  return wallet
}

export async function archiveWallet(id) {
  await db.wallets.update(id, { status: 'archived', updated_at_ms: Date.now() })
}
