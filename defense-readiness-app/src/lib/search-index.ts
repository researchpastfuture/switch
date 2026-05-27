// Helpers for the build-time search index consumed by SearchBox (Fuse.js).
export interface SearchRecord {
  number: number;
  slug: string;
  title: string;
  summary: string;
  headings: string[];
  body: string;
  kind: 'section' | 'glossary';
  url: string;
}

/** Strip MDX/Markdown to readable plain text for indexing. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/, '') // frontmatter
    .replace(/```[\s\S]*?```/g, ' ') // code fences
    .replace(/<[^>]+>/g, ' ') // jsx/html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/[#>*_`~|-]/g, ' ') // markdown punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractHeadings(md: string): string[] {
  const out: string[] = [];
  const re = /^#{2,6}\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) out.push(m[1].trim());
  return out;
}
