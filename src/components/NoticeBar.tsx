import { getNoticeBar } from '@/lib/site-settings'
import { NoticeBarDisplay } from '@/components/NoticeBarDisplay'

export async function NoticeBar() {
  const noticeBar = await getNoticeBar()

  if (!noticeBar.enabled || !noticeBar.message.trim()) return null

  return <NoticeBarDisplay message={noticeBar.message} color={noticeBar.color} />
}
