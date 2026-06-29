import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

const BASE = 'https://hierarchy.directory'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [persons, sees] = await Promise.all([
    prisma.person.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.see.findMany({
      where: { dateSuppressed: null },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/bishops`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/dioceses`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/build-directory`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about/data`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const bishopPages: MetadataRoute.Sitemap = persons.map(p => ({
    url:             `${BASE}/bishops/${p.slug}`,
    lastModified:    p.updatedAt,
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  const diocesePages: MetadataRoute.Sitemap = sees.map(s => ({
    url:             `${BASE}/dioceses/${s.slug}`,
    lastModified:    s.updatedAt,
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  return [...staticPages, ...bishopPages, ...diocesePages]
}
