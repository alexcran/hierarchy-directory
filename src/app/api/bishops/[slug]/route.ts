import { NextResponse } from 'next/server'
import { getBishopBySlug } from '@/lib/queries/bishops'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const bishop = await getBishopBySlug(params.slug)
    if (!bishop) {
      return NextResponse.json({ error: 'Bishop not found' }, { status: 404 })
    }
    return NextResponse.json(bishop)
  } catch (err) {
    console.error(`[GET /api/bishops/${params.slug}]`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
