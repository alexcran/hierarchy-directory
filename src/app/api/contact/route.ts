import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const SUBJECTS = new Set([
  'Data Correction',
  'Portrait Submission',
  'General Inquiry',
  'Partnership',
  'Media',
  'Image Concern',
  'Other',
])

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function getClientKey(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(key: string) {
  const now = Date.now()
  const current = rateLimit.get(key)

  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (current.count >= RATE_LIMIT_MAX) return false
  current.count += 1
  return true
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const name = clean(body.name)
  const email = clean(body.email)
  const subject = clean(body.subject)
  const message = clean(body.message)
  const website = clean(body.website)

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  if (website) {
    return NextResponse.json({ ok: true })
  }

  if (!checkRateLimit(getClientKey(req))) {
    return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 })
  }

  if (name.length > 120) {
    return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })
  }

  if (!isValidEmail(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  if (!SUBJECTS.has(subject)) {
    return NextResponse.json({ error: 'Please select a valid subject.' }, { status: 400 })
  }

  if (message.length < 10) {
    return NextResponse.json({ error: 'Message is too short.' }, { status: 400 })
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured.' }, { status: 503 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />')

  try {
    await resend.emails.send({
      from: 'Hierarchy.Directory <noreply@mail.hierarchy.directory>',
      to: 'info@hierarchy.directory',
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="margin:0;padding:0;background:#FAF8F5;color:#1A1714;font-family:Arial,sans-serif;">
          <div style="max-width:640px;margin:0 auto;padding:32px 24px;">
            <p style="margin:0 0 8px;font-size:12px;line-height:1.4;text-transform:uppercase;letter-spacing:0.12em;color:#9C958D;font-weight:700;">
              Hierarchy.Directory Contact Form
            </p>
            <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:32px;line-height:1.15;color:#1A1714;font-weight:600;">
              ${safeSubject}
            </h1>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
              <tr>
                <td style="padding:10px 0;border-top:1px solid #DDD8D0;font-size:13px;color:#6B6560;width:96px;">Name</td>
                <td style="padding:10px 0;border-top:1px solid #DDD8D0;font-size:15px;color:#1A1714;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-top:1px solid #DDD8D0;font-size:13px;color:#6B6560;">Email</td>
                <td style="padding:10px 0;border-top:1px solid #DDD8D0;font-size:15px;color:#1A1714;">
                  <a href="mailto:${safeEmail}" style="color:#7A1B2E;text-decoration:underline;">${safeEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-top:1px solid #DDD8D0;border-bottom:1px solid #DDD8D0;font-size:13px;color:#6B6560;">Subject</td>
                <td style="padding:10px 0;border-top:1px solid #DDD8D0;border-bottom:1px solid #DDD8D0;font-size:15px;color:#1A1714;">${safeSubject}</td>
              </tr>
            </table>
            <div style="font-size:16px;line-height:1.65;color:#1A1714;">
              ${safeMessage}
            </div>
          </div>
        </div>
      `,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        '',
        message,
      ].join('\n'),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact form send error:', err)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
