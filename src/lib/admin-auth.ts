import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from './supabase-server'

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  const allowed = adminEmails()

  if (allowed.length === 0 && process.env.NODE_ENV !== 'production') {
    return true
  }

  return !!email && allowed.includes(email.toLowerCase())
}

export async function adminAuthCheck() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isAllowedAdminEmail(user.email)) {
    return { user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}
