'use client'
import { useState } from 'react'

const SUBJECTS = [
  'Data Correction',
  'Portrait Submission',
  'General Inquiry',
  'Partnership',
  'Media',
  'Image Concern',
  'Other',
]

const INPUT_CLASS =
  'w-full px-3 py-2.5 text-[15px] font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'

const LABEL_CLASS = 'block text-[13px] font-body font-semibold text-text-secondary mb-1.5'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong.')
      }
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <div className="mx-auto max-w-[700px] px-6 py-16 text-center md:py-20">
      <h1 className="font-display text-5xl font-semibold text-text-primary mb-4 md:text-6xl">Contact</h1>

      <p className="mx-auto max-w-[600px] font-body text-[16px] text-text-secondary leading-relaxed mb-2">
        For corrections, feedback, or inquiries, email{' '}
        <a href="mailto:info@hierarchy.directory" className="text-burgundy hover:underline underline-offset-2">
          info@hierarchy.directory
        </a>{' '}
        or use the form below.
      </p>
      <p className="mx-auto max-w-[600px] font-body text-[16px] text-text-secondary leading-relaxed mb-10">
        If you are a representative of an (arch)diocese or bishop and would like to contribute an official
        portrait or updated information, we&rsquo;d love to hear from you — please select &ldquo;Portrait
        Submission&rdquo; or &ldquo;Data Correction&rdquo; below.
      </p>

      {status === 'success' ? (
        <div className="mx-auto max-w-[600px] bg-green-50 border border-green-200 rounded-xl px-6 py-8 text-center">
          <p className="font-display text-2xl font-semibold text-text-primary mb-2">Message sent</p>
          <p className="font-body text-[16px] text-text-secondary leading-relaxed">
            Thank you for your message. We&rsquo;ll get back to you as soon as possible.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto max-w-[600px] space-y-5 text-left">
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={e => set('website', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="name" className={LABEL_CLASS}>Name</label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Your name"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="email" className={LABEL_CLASS}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="you@example.com"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="subject" className={LABEL_CLASS}>Subject</label>
            <select
              id="subject"
              required
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              className={`${INPUT_CLASS} cursor-pointer`}
            >
              <option value="">Select a subject…</option>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="message" className={LABEL_CLASS}>Message</label>
            <textarea
              id="message"
              required
              rows={6}
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="Your message…"
              className={`${INPUT_CLASS} resize-y`}
            />
          </div>

          {status === 'error' && (
            <p className="text-[14px] font-body text-red-600">{errorMsg}</p>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="px-6 py-2.5 bg-burgundy text-white font-body font-semibold text-[15px] rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </form>
      )}

      {/* Below form */}
      <p className="mx-auto max-w-[600px] font-body text-[15px] text-text-secondary leading-relaxed mt-12 pt-10 border-t border-border">
        Hierarchy.Directory is a free resource maintained in my spare time. If you find it useful, consider{' '}
        <a
          href="https://ko-fi.com/hierarchydirectory"
          target="_blank"
          rel="noopener noreferrer"
          className="text-burgundy hover:underline underline-offset-2"
        >
          buying me a coffee
        </a>
        .
      </p>
    </div>
  )
}
