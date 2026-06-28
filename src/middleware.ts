import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

function isAdminEmail(email: string | null | undefined): boolean {
  if (ADMIN_EMAILS.length === 0 && process.env.NODE_ENV !== 'production') return true
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

function getSupabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    return new URL(url).hostname.split('.')[0] || null
  } catch {
    return null
  }
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return atob(padded)
}

function getAuthCookieValue(req: NextRequest): string | null {
  const projectRef = getSupabaseProjectRef()
  if (!projectRef) return null

  const key = `sb-${projectRef}-auth-token`
  const direct = req.cookies.get(key)?.value
  if (direct) return direct

  const chunks: string[] = []
  for (let i = 0; i < 8; i += 1) {
    const value = req.cookies.get(`${key}.${i}`)?.value
    if (!value) break
    chunks.push(value)
  }
  return chunks.length ? chunks.join('') : null
}

function getAccessToken(req: NextRequest): string | null {
  const rawCookie = getAuthCookieValue(req)
  if (!rawCookie) return null

  const rawSession = rawCookie.startsWith('base64-')
    ? decodeBase64Url(rawCookie.slice('base64-'.length))
    : rawCookie

  try {
    const session = JSON.parse(rawSession)
    if (typeof session?.access_token === 'string') return session.access_token
    if (Array.isArray(session) && typeof session[0] === 'string') return session[0]
  } catch {
    return null
  }

  return null
}

async function getSupabaseUserEmail(req: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const accessToken = getAccessToken(req)
  if (!supabaseUrl || !anonKey || !accessToken) return null

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!response.ok) return null
    const user = await response.json()
    return typeof user?.email === 'string' ? user.email : null
  } catch {
    return null
  }
}

const COMING_SOON = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hierarchy.Directory — Coming Soon</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FAF8F5;
      font-family: 'Georgia', serif;
      color: #1A1714;
      padding: 2rem;
      text-align: center;
    }
    img { width: 280px; max-width: 100%; margin-bottom: 2.5rem; }
    p { font-size: 1.1rem; color: #6B6560; line-height: 1.7; max-width: 400px; }
  </style>
</head>
<body>
  <img src="/hierarchy-directory-logo.svg" alt="Hierarchy.Directory">
  <p>A visual directory of the hierarchy of the Catholic Church. Coming soon.</p>
</body>
</html>`

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Pass through: admin routes, API routes, static assets
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next()
  }

  const email = await getSupabaseUserEmail(req)
  if (isAdminEmail(email)) return NextResponse.next()

  return new NextResponse(COMING_SOON, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
}
