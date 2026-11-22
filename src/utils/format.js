/**
 * Indian digit grouping, written by hand.
 *
 * The web app used Number#toLocaleString('en-IN'). On React Native / Hermes,
 * Intl support varies by platform and build, and 'en-IN' grouping silently
 * falls back to plain 3-digit grouping on some Android builds. Doing it
 * manually keeps ₹1,00,000 correct everywhere.
 */
function groupIndian(intStr) {
  if (intStr.length <= 3) return intStr
  const last3 = intStr.slice(-3)
  const rest = intStr.slice(0, -3)
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
}

export function formatINR(value, decimals = 0) {
  const num = Number(value || 0)
  const negative = num < 0
  const fixed = Math.abs(num).toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const grouped = groupIndian(intPart)
  return `${negative ? '-' : ''}₹${grouped}${decPart ? '.' + decPart : ''}`
}

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

export const YEARS = [2024, 2025, 2026, 2027]

export const todayISO = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const isoToDate = (iso) => {
  if (!iso) return new Date()
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const dateToISO = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const prettyDate = (iso) => {
  if (!iso) return ''
  const d = isoToDate(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
