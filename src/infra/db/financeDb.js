// src/infra/db/financeDb.js
import Dexie from 'dexie'
import { defaultWalletAppearance, defaultCategoryAppearance } from '../../domain/appearance.js'

export const db = new Dexie('finance_pwa')

db.version(1).stores({
  meta: 'key',
  wallets: 'id, name, status, created_at_ms, updated_at_ms',
  categories: 'id, name, type, status, created_at_ms, updated_at_ms',
  transactions: 'id, wallet_id, category_id, type, status, occurred_at_ms, created_at_ms, updated_at_ms, replaced_transaction_id, device_id, group_id, group_type, group_role, related_wallet_id',
  sync_queue: 'id, entity_type, entity_id, action, created_at_ms',
})

db.version(2).stores({
  meta: 'key',
  wallets: 'id, name, status, created_at_ms, updated_at_ms',
  categories: 'id, name, type, status, created_at_ms, updated_at_ms',
  transactions: 'id, wallet_id, category_id, type, status, occurred_at_ms, created_at_ms, updated_at_ms, replaced_transaction_id, device_id, group_id, group_type, group_role, related_wallet_id',
  sync_queue: 'id, entity_type, entity_id, action, created_at_ms',
}).upgrade(async (trans) => {
  await trans.table('wallets').toCollection().modify((w) => {
    if (!w.icon || !w.color) {
      const def = defaultWalletAppearance(w.id)
      w.icon = w.icon || def.icon
      w.color = w.color || def.color
      w.updated_at_ms = Date.now()
    }
  })

  await trans.table('categories').toCollection().modify((c) => {
    if (!c.icon || !c.color) {
      const def = defaultCategoryAppearance(c.id, c.type)
      c.icon = c.icon || def.icon
      c.color = c.color || def.color
      c.updated_at_ms = Date.now()
    }
  })
})
