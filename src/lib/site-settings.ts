import { revalidateTag, unstable_cache } from 'next/cache'
import { type Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { NOTICE_BAR_DEFAULT, type NoticeBarSetting } from '@/lib/site-settings-data'

export const SITE_SETTINGS_TAG = 'site-settings'

const readSetting = unstable_cache(
  async (key: string) => {
    return prisma.siteSetting.findUnique({
      where: { key },
      select: { value: true },
    })
  },
  ['site-settings'],
  { tags: [SITE_SETTINGS_TAG] },
)

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const setting = await readSetting(key)
  return setting ? (setting.value as T) : fallback
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: value as Prisma.InputJsonValue },
    update: { value: value as Prisma.InputJsonValue },
  })

  revalidateTag(SITE_SETTINGS_TAG)
}

export async function getNoticeBar(): Promise<NoticeBarSetting> {
  const value = await getSetting<NoticeBarSetting>('noticeBar', NOTICE_BAR_DEFAULT)

  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : NOTICE_BAR_DEFAULT.enabled,
    message: typeof value.message === 'string' ? value.message : NOTICE_BAR_DEFAULT.message,
    color: typeof value.color === 'string' ? value.color : NOTICE_BAR_DEFAULT.color,
  }
}
