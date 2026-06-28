import { requireAdmin } from '@/lib/auth'
import { AdminNav } from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 w-full">
      <AdminNav />
      <div className="mt-8">{children}</div>
    </div>
  )
}
