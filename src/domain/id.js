// src/domain/id.js
export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  // fallback minimal kalau randomUUID tidak ada
  const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
  return `${rnd()}-${rnd().slice(0,4)}-${rnd().slice(0,4)}-${rnd().slice(0,4)}-${rnd()}${rnd().slice(0,4)}`
}
