export function normalizeWhatsAppNumber(value) {
  let digits = String(value || '').replace(/\D/g, '')

  if (digits.startsWith('00')) digits = digits.slice(2)
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`
  if (/^5\d{8}$/.test(digits)) return `966${digits}`

  return digits
}

export function buildWhatsAppUrl(number, message = '') {
  const normalizedNumber = normalizeWhatsAppNumber(number)
  if (!normalizedNumber) return ''

  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${normalizedNumber}${query}`
}
