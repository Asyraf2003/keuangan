import { db } from '../db/financeDb.js'
import { defaultCategoryAppearance, normalizeHexColor, normalizeIcon } from '../../domain/appearance.js'

function vErr(details) {
  const e = new Error('Validation')
  e.code = 'VALIDATION'
  e.details = details
  return e
}

function norm(s) { return String(s || '').trim().toLowerCase() }
function isLockedCategoryName(name) {
  const n = norm(name)
  return n === 'lainnya' || n === 'biaya lainnya'
}

export async function listCategories({ includeArchived = false } = {}) {
  if (includeArchived) return db.categories.orderBy('created_at_ms').toArray()
  return db.categories.where('status').equals('active').sortBy('created_at_ms')
}

export async function createCategory({ name, type, color = null, icon = null }) {
  const n = String(name ?? '').trim()
  const t = String(type ?? '').trim()
  if (!n) throw vErr(['nama kategori wajib'])
  if (!(t === 'income' || t === 'expense')) throw vErr(['type kategori harus income/expense'])

  const now = Date.now()
  const id = crypto.randomUUID()
  const def = defaultCategoryAppearance(id, t)

  const cat = {
    id,
    name: n,
    type: t,
    status: 'active',
    color: normalizeHexColor(color, def.color),
    icon: normalizeIcon(icon, def.icon),
    created_at_ms: now,
    updated_at_ms: now,
  }

  await db.categories.add(cat)
  return cat
}

export async function archiveCategory(id) {
  const cat = await db.categories.get(id)
  if (!cat) return
  if (isLockedCategoryName(cat.name)) throw vErr(['kategori default (Lainnya/Biaya lainnya) tidak boleh di-archive'])
  await db.categories.update(id, { status: 'archived', updated_at_ms: Date.now() })
}
