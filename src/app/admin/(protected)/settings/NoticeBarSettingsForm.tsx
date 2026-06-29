'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { NoticeBarDisplay } from '@/components/NoticeBarDisplay'
import { NOTICE_BAR_INITIAL, type NoticeBarSetting } from '@/lib/site-settings-data'
import { updateNoticeBar, type NoticeBarActionState } from './actions'

const initialActionState: NoticeBarActionState = {
  status: 'idle',
  message: '',
}

const inputClass = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'

function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}

export function NoticeBarSettingsForm({ initial }: { initial: NoticeBarSetting }) {
  const [state, formAction] = useFormState(updateNoticeBar, initialActionState)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [message, setMessage] = useState(initial.message)
  const [color, setColor] = useState(initial.color)

  useEffect(() => {
    if (state.status === 'saved') {
      setEnabled(enabled)
      setMessage(message)
      setColor(color)
    }
  }, [color, enabled, message, state.status])

  const previewMessage = message.trim() || NOTICE_BAR_INITIAL.message
  const previewColor = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color) ? color : NOTICE_BAR_INITIAL.color

  return (
    <form action={formAction} className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-body text-sm font-semibold text-text-primary">Notice Bar</h2>
      </div>

      <div className="px-6 py-5 space-y-5">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span className="relative inline-flex">
            <input
              type="checkbox"
              name="enabled"
              className="sr-only"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            <span className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-burgundy' : 'bg-border'}`} />
            <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
          </span>
          <span className="text-sm font-body text-text-secondary">Enable notice bar</span>
        </label>

        <div>
          <label htmlFor="notice-message" className="block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Message
          </label>
          <input
            id="notice-message"
            name="message"
            type="text"
            maxLength={200}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={NOTICE_BAR_INITIAL.message}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="notice-color" className="block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Bar color
          </label>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-10 w-10 flex-shrink-0 rounded-lg border border-border"
              style={{ backgroundColor: previewColor }}
            />
            <input
              id="notice-color"
              name="color"
              type="text"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              placeholder={NOTICE_BAR_INITIAL.color}
              pattern="#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <p className="block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Preview
          </p>
          <div className="border border-border overflow-hidden">
            {enabled && previewMessage ? (
              <NoticeBarDisplay message={previewMessage} color={previewColor} />
            ) : (
              <div className="px-4 py-2.5 text-center font-body text-[13px] leading-snug tracking-[0.02em] text-text-tertiary bg-surface">
                Notice bar hidden
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SaveButton />
          {state.status !== 'idle' && (
            <span className={`text-sm font-body ${state.status === 'saved' ? 'text-green-700' : 'text-red-700'}`}>
              {state.message}
            </span>
          )}
        </div>
      </div>
    </form>
  )
}
