// src/domain/factories.js
import { newId } from './id.js'
import { nowMs } from './time.js'
import { pickRandom, WALLET_ICONS, CATEGORY_ICONS, COLORS } from './palette.js'

export function makeWallet({ name }) {
  const t = nowMs()
  return {
    id: newId(),
    name: String(name || 'Wallet'),
    status: 'active',
    icon: pickRandom(WALLET_ICONS),
    color: pickRandom(COLORS),
    created_at_ms: t,
    updated_at_ms: t,
  }
}

export function makeCategory({ name, type }) {
  const t = nowMs()
  return {
    id: newId(),
    name: String(name || 'Category'),
    type, // 'income' | 'expense'
    status: 'active',
    icon: pickRandom(CATEGORY_ICONS),
    color: pickRandom(COLORS),
    created_at_ms: t,
    updated_at_ms: t,
  }
}
