// src/infra/repos/metaRepo.js
import { db } from '../db/financeDb.js'

export async function getMeta(key) {
  const row = await db.meta.get(key)
  return row ? row.value : null
}

export async function setMeta(key, value) {
  await db.meta.put({ key, value })
}

export async function ensureMeta(key, getDefaultValue) {
  const existing = await getMeta(key)
  if (existing !== null && existing !== undefined) return existing
  const v = getDefaultValue()
  await setMeta(key, v)
  return v
}
