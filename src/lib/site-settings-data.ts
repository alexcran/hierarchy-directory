export type NoticeBarSetting = {
  enabled: boolean
  message: string
  color: string
}

export const NOTICE_BAR_DEFAULT: NoticeBarSetting = {
  enabled: false,
  message: '',
  color: '#7A1B2E',
}

export const NOTICE_BAR_INITIAL: NoticeBarSetting = {
  enabled: true,
  message: 'Still in beta — data is being thoroughly audited and verified',
  color: '#7A1B2E',
}
