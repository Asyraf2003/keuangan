// src/domain/appearance.js

export const WALLET_COLORS = [
  '#111111', '#1F2937', '#0F766E', '#1D4ED8', '#6D28D9',
  '#9F1239', '#B45309', '#166534', '#0E7490', '#7C2D12',
]

export const CATEGORY_COLORS = [
  '#111111', '#334155', '#0F766E', '#1D4ED8', '#6D28D9',
  '#BE123C', '#B45309', '#15803D', '#0284C7', '#A21CAF',
]

export const WALLET_ICONS = ['💵','💳','🏦','📱','🧾','🪙','💼','📦']
export const INCOME_ICONS = ['💰','🧑‍💻','🏆','🎁','📈']
export const EXPENSE_ICONS = ['🛒','🍜','🚗','🩺','🎮','👕','🏠','🧾']

function hashStr(s) {
  const str = String(s || '')
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0)
}

function pick(list, seed) {
  if (!list || list.length === 0) return null
  return list[seed % list.length]
}

export function normalizeHexColor(input, fallback) {
  const s = String(input || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s
  return fallback
}

export function normalizeIcon(input, fallback) {
  const s = String(input || '').trim()
  return s ? s : fallback
}

export function defaultWalletAppearance(id) {
  const seed = hashStr(id)
  return {
    color: pick(WALLET_COLORS, seed) || '#111111',
    icon: pick(WALLET_ICONS, seed) || '💵',
  }
}

export function defaultCategoryAppearance(id, type) {
  const seed = hashStr(`${id}:${type}`)
  const icons = type === 'income' ? INCOME_ICONS : EXPENSE_ICONS
  return {
    color: pick(CATEGORY_COLORS, seed) || '#111111',
    icon: pick(icons, seed) || (type === 'income' ? '💰' : '🛒'),
  }
}

export function randomWalletAppearance() {
  const c = WALLET_COLORS[Math.floor(Math.random() * WALLET_COLORS.length)] || '#111111'
  const i = WALLET_ICONS[Math.floor(Math.random() * WALLET_ICONS.length)] || '💵'
  return { color: c, icon: i }
}

export function randomCategoryAppearance(type) {
  const c = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)] || '#111111'
  const icons = type === 'income' ? INCOME_ICONS : EXPENSE_ICONS
  const i = icons[Math.floor(Math.random() * icons.length)] || (type === 'income' ? '💰' : '🛒')
  return { color: c, icon: i }
}
