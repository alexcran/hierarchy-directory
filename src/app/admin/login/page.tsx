import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAllowedAdminEmail } from '@/lib/admin-auth'
import { LoginForm } from './LoginForm'

export default async function AdminLoginPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user && isAllowedAdminEmail(user.email)) redirect('/admin')

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-border rounded-xl shadow-sm px-8 py-10">
        <div className="text-center mb-8">
          <p className="font-display text-3xl font-semibold text-text-primary leading-none">hierarchy</p>
          <p className="font-body text-sm text-text-tertiary">.directory admin</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
