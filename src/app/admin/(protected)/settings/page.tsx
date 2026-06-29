import { NoticeBarSettingsForm } from './NoticeBarSettingsForm'
import { getSetting } from '@/lib/site-settings'
import { NOTICE_BAR_INITIAL, type NoticeBarSetting } from '@/lib/site-settings-data'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const noticeBar = await getSetting<NoticeBarSetting>('noticeBar', NOTICE_BAR_INITIAL)

  const initial = {
    enabled: typeof noticeBar.enabled === 'boolean' ? noticeBar.enabled : NOTICE_BAR_INITIAL.enabled,
    message: typeof noticeBar.message === 'string' ? noticeBar.message : NOTICE_BAR_INITIAL.message,
    color: typeof noticeBar.color === 'string' ? noticeBar.color : NOTICE_BAR_INITIAL.color,
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Settings</h1>
      </div>

      <NoticeBarSettingsForm initial={initial} />
    </>
  )
}
