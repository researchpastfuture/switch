import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Section prose lives in /content/sections/*.mdx (outside src so it is easy to find/edit).
// This schema validates the frontmatter at build time — a bad edit fails with a readable
// error instead of shipping a broken page.
const sections = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './content/sections' }),
  schema: z.object({
    number: z.number().int().min(1).max(17),
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    // The interactive widget for this section. `type` is the discriminator that
    // ToolRenderer switches on. `dataKey` names a file in src/data/tools/.
    tool: z
      .object({
        type: z.string(),
        dataKey: z.string().optional(),
        title: z.string().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      })
      .nullable()
      .default(null),
    // Optional numbered references rendered at the foot of the section.
    sources: z
      .array(
        z.object({
          label: z.string(),
          url: z.url().optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = { sections };
