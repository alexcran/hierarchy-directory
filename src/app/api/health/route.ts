import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {}

  checks.DATABASE_URL = process.env.DATABASE_URL
    ? `set (${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')})`
    : 'MISSING'

  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? 'set'
    : 'MISSING'

  checks.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? 'set'
    : 'MISSING'

  checks.ADMIN_EMAILS = process.env.ADMIN_EMAILS
    ? `set (${process.env.ADMIN_EMAILS})`
    : 'MISSING'

  try {
    const count = await prisma.person.count()
    checks.db = `ok — ${count} persons`
  } catch (err) {
    checks.db = `ERROR: ${err instanceof Error ? err.message : String(err)}`
  }

  const ok = !Object.values(checks).some(v => v.startsWith('MISSING') || v.startsWith('ERROR'))
  return NextResponse.json(checks, { status: ok ? 200 : 500 })
}
