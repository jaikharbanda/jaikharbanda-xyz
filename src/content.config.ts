import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    pillars: z.array(z.enum(['gtm', 'ai'])).min(1),
    date: z.coerce.date(),
    summary: z.string(),
    featured: z.boolean().default(false),
    artifacts: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    note: z.string().optional(),
  }),
});

const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    name: z.string(),
  }),
});

export const collections = { work, sections };
