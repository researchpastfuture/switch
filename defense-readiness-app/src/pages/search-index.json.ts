import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { stripMarkdown, extractHeadings, type SearchRecord } from '../lib/search-index';
import { glossary } from '../data/tools';

export const GET: APIRoute = async () => {
  const sections = await getCollection('sections');
  const records: SearchRecord[] = [];

  for (const entry of sections) {
    const raw = entry.body ?? '';
    records.push({
      number: entry.data.number,
      slug: entry.data.slug,
      title: entry.data.title,
      summary: entry.data.summary,
      headings: extractHeadings(raw),
      body: stripMarkdown(raw),
      kind: 'section',
      url: `/sections/${entry.data.slug}`,
    });
  }

  for (const term of glossary.glossary) {
    records.push({
      number: 17,
      slug: 'appendices',
      title: term.term,
      summary: term.definition,
      headings: [],
      body: term.definition,
      kind: 'glossary',
      url: '/sections/appendices',
    });
  }

  records.sort((a, b) => a.number - b.number);
  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json' },
  });
};
