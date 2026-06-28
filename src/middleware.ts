import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

function isAdminEmail(email: string | null | undefined): boolean {
  if (ADMIN_EMAILS.length === 0 && process.env.NODE_ENV !== 'production') return true
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
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

  // Check for valid admin session
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isAdminEmail(user?.email)) return res

  return new NextResponse(COMING_SOON, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
}
