import { NextResponse } from 'next/server'

export function adminError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

export function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function optionalStringUpdate(body: Record<string, unknown>, field: string): string | null | undefined {
  return field in body ? optionalString(body[field]) : undefined
}

export function optionalDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date')
  return date
}

export function optionalDateUpdate(body: Record<string, unknown>, field: string): Date | null | undefined {
  return field in body ? optionalDate(body[field]) : undefined
}

export function optionalBooleanUpdate(body: Record<string, unknown>, field: string): boolean | undefined {
  return typeof body[field] === 'boolean' ? body[field] : undefined
}

export function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`)
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

export function validateImageFile(
  value: FormDataEntryValue | null,
  allowedTypes: readonly string[],
  maxBytes: number,
): File {
  if (!(value instanceof File)) throw new Error('Image file is required')
  if (!allowedTypes.includes(value.type)) throw new Error(`Unsupported image type: ${value.type || 'unknown'}`)
  if (value.size <= 0) throw new Error('Image file is empty')
  if (value.size > maxBytes) throw new Error(`Image must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB`)
  return value
}
