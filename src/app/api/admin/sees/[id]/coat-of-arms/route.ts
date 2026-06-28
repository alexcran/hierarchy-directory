import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { adminError, validateImageFile } from '@/lib/admin/validators'

export const dynamic = 'force-dynamic'

const BUCKET = 'coat-of-arms'
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'] as const

function extOf(file: File): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
  }
  return map[file.type] ?? 'jpg'
}

function pathFor(seeId: string, file: File) {
  return `${seeId}.${extOf(file)}`
}

async function removeExistingCoatOfArms(seeId: string, keepPath?: string) {
  const supabase = createSupabaseAdminClient()
  const existingPaths = ['jpg', 'png', 'svg', 'webp']
    .map((ext) => `${seeId}.${ext}`)
    .filter((path) => path !== keepPath)

  if (existingPaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(existingPaths)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  try {
    const formData = await req.formData()
    const file = validateImageFile(formData.get('file'), ACCEPTED_TYPES, MAX_BYTES)
    const path = pathFor(params.id, file)
    const supabase = createSupabaseAdminClient()

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    await removeExistingCoatOfArms(params.id, path)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    await prisma.see.update({
      where: { id: params.id },
      data: { coatOfArmsUrl: data.publicUrl },
    })

    return NextResponse.json({ ok: true, url: `${data.publicUrl}?v=${Date.now()}` })
  } catch (err) {
    return adminError(err instanceof Error ? err.message : 'Coat of arms upload failed', 400)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  try {
    await removeExistingCoatOfArms(params.id)
    await prisma.see.update({
      where: { id: params.id },
      data: { coatOfArmsUrl: null },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return adminError(err instanceof Error ? err.message : 'Coat of arms delete failed', 400)
  }
}
