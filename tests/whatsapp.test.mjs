import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from '../.vitepress/theme/whatsapp.js'

test('normalizes common Saudi WhatsApp number formats', () => {
  assert.equal(normalizeWhatsAppNumber('050 123 4567'), '966501234567')
  assert.equal(normalizeWhatsAppNumber('+966 50 123 4567'), '966501234567')
  assert.equal(normalizeWhatsAppNumber('00966-50-123-4567'), '966501234567')
})

test('keeps valid international numbers and rejects empty values', () => {
  assert.equal(normalizeWhatsAppNumber('+971 50 123 4567'), '971501234567')
  assert.equal(normalizeWhatsAppNumber('not a number'), '')
})

test('builds a WhatsApp conversation URL with an encoded message', () => {
  assert.equal(
    buildWhatsAppUrl('0501234567', 'مرحباً'),
    'https://wa.me/966501234567?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B'
  )
  assert.equal(buildWhatsAppUrl('', 'مرحباً'), '')
})
