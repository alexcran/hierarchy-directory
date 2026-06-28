import { NextResponse } from 'next/server'
import { getDioceseBySlug } from '@/lib/queries/dioceses'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const diocese = await getDioceseBySlug(params.slug)
    if (!diocese) {
      return NextResponse.json({ error: 'Diocese not found' }, { status: 404 })
    }
    return NextResponse.json(diocese)
  } catch (err) {
    console.error(`[GET /api/dioceses/${params.slug}]`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
