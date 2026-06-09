import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default("Aunmoy Dey Tanmoy"),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
  })
});

const learning = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    isADR: z.boolean().default(false),
    adrStatus: z.string().optional(), // e.g., "Accepted", "Proposed"
  })
});

export const collections = { blog, learning };
