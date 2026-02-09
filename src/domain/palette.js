// src/domain/palette.js
export const WALLET_ICONS = ['wallet', 'cash', 'bank', 'card']
export const CATEGORY_ICONS = ['tag', 'food', 'car', 'bolt', 'gift']

export const COLORS = [
  '#111827', '#2563EB', '#16A34A', '#DC2626', '#7C3AED',
  '#EA580C', '#0EA5E9', '#059669', '#DB2777'
]

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
