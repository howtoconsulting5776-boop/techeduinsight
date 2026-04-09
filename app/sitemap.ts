import type { MetadataRoute } from 'next'
import { createClient } from '@/app/lib/supabase/server'
import { getMetadataBase } from '@/app/lib/site-metadata'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getMetadataBase().origin
  const supabase = await createClient()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${origin}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${origin}/news`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${origin}/insights`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${origin}/lectures`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${origin}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  const { data: insights } = await supabase
    .from('edu_insights')
    .select('id, updated_at, published_at')
    .eq('is_published', true)

  const insightEntries: MetadataRoute.Sitemap = (insights ?? []).map((row) => {
    const r = row as { id: string; updated_at: string; published_at: string }
    return {
      url: `${origin}/insights/${r.id}`,
      lastModified: new Date(r.updated_at || r.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }
  })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, created_at')
    .eq('status', 'published')

  const projectEntries: MetadataRoute.Sitemap = (projects ?? []).map((row) => {
    const r = row as { id: string; created_at: string }
    return {
      url: `${origin}/projects/${r.id}`,
      lastModified: new Date(r.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  return [...staticEntries, ...insightEntries, ...projectEntries]
}
