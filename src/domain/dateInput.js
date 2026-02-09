// src/domain/dateInput.js
export function toDateInputValue(ms) {
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function fromDateInputValue(value) {
  // interpret as local date at 00:00
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, (m - 1), d, 0, 0, 0, 0)
  return dt.getTime()
}
