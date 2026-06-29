export function NoticeBarDisplay({
  message,
  color = '#7A1B2E',
}: {
  message: string
  color?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full px-4 py-2.5 text-center font-body text-[13px] leading-snug tracking-[0.02em] text-[#FAF8F5]"
      style={{ backgroundColor: color }}
    >
      {message}
    </div>
  )
}
