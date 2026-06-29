'use server'

import { z } from 'zod'
import { setSetting } from '@/lib/site-settings'

const noticeBarSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(200),
  color: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Enter a valid hex color, like #7A1B2E.'),
})

export type NoticeBarActionState = {
  status: 'idle' | 'saved' | 'error'
  message: string
}

export async function updateNoticeBar(
  _previousState: NoticeBarActionState,
  formData: FormData,
): Promise<NoticeBarActionState> {
  const parsed = noticeBarSchema.safeParse({
    enabled: formData.get('enabled') === 'on',
    message: String(formData.get('message') ?? ''),
    color: String(formData.get('color') ?? ''),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Invalid notice bar settings.',
    }
  }

  await setSetting('noticeBar', parsed.data)

  return {
    status: 'saved',
    message: 'Settings saved.',
  }
}
