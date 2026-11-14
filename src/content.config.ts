import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Aunmoy Dey Tanmoy'),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
  }),
});

const learning = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/learning' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    isADR: z.boolean().default(false),
    adrStatus: z.string().optional(),
  }),
});

const knowledge = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/knowledge' }),
  schema: z.object({
    type: z.enum(['academic', 'research', 'research-note', 'essay', 'personal-story', 'travel', 'book', 'quote', 'reflection']),
    status: z.enum(['draft', 'published', 'unlisted', 'private']).default('draft'),
    title: z.string().min(1),
    description: z.string().default(''),
    date: z.coerce.date().default(() => new Date()),
    category: z.string().default(''),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().int().default(0),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    galleryCaptions: z.array(z.string()).default([]),
    body: z.string().optional(),
    abstract: z.string().optional(),
    researchQuestion: z.string().optional(),
    objectives: z.string().optional(),
    background: z.string().optional(),
    literatureReview: z.string().optional(),
    methodology: z.string().optional(),
    materialsAndMethods: z.string().optional(),
    findings: z.string().optional(),
    discussion: z.string().optional(),
    conclusion: z.string().optional(),
    references: z.array(z.string()).default([]),
    documents: z.array(z.string()).default([]),
    university: z.string().optional(),
    degree: z.string().optional(),
    department: z.string().optional(),
    faculty: z.string().optional(),
    graduationYear: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    academicInterests: z.array(z.string()).default([]),
    thesisTitle: z.string().optional(),
    academicQualifications: z.array(z.string()).default([]),
    achievements: z.array(z.string()).default([]),
    coursework: z.array(z.string()).default([]),
    researchInterests: z.array(z.string()).default([]),
    relevantLinks: z.array(z.string()).default([]),
    relatedProjects: z.array(z.string()).default([]),
    country: z.string().optional(),
    location: z.string().optional(),
    visitedPlaces: z.array(z.string()).default([]),
    travelStart: z.string().optional(),
    travelEnd: z.string().optional(),
    bookTitle: z.string().optional(),
    bookAuthor: z.string().optional(),
    publisher: z.string().optional(),
    edition: z.string().optional(),
    readingStatus: z.enum(['want-to-read', 'reading', 'finished', 'paused']).optional(),
    readingStart: z.string().optional(),
    readingEnd: z.string().optional(),
    concepts: z.array(z.string()).default([]),
    quoteText: z.string().optional(),
    quoteAuthor: z.string().optional(),
    quoteSource: z.string().optional(),
    quotePage: z.string().optional(),
    interpretation: z.string().optional(),
    takeaways: z.array(z.string()).default([]),
  }).superRefine((entry, ctx) => {
    if (entry.type === 'academic' && (!entry.university || !entry.degree || !entry.department)) {
      ctx.addIssue({ code: 'custom', message: 'Academic profiles require university, degree, and department.' });
    }
    if (entry.type === 'quote' && (!entry.quoteText || !entry.quoteAuthor || !entry.quoteSource)) {
      ctx.addIssue({ code: 'custom', message: 'Quotes require text, author, and a verified source.' });
    }
    if (entry.type === 'travel' && (!entry.country || !entry.location)) {
      ctx.addIssue({ code: 'custom', message: 'Travel stories require a country and location.' });
    }
    if (entry.type === 'book' && (!entry.bookTitle || !entry.bookAuthor)) {
      ctx.addIssue({ code: 'custom', message: 'Book notes require a title and author.' });
    }
  }),
});

export const collections = { blog, learning, knowledge };
