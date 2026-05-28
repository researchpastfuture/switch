import { SITE } from '../data/site';

export function formatCitation(sectionTitle: string, sectionNumber: number): string {
  const accessed = new Date().toISOString().slice(0, 10);
  const url =
    typeof window !== 'undefined' ? window.location.href : SITE.baseUrl;
  const locator = url ? ` ${url}.` : '';
  return `${SITE.author}. "${sectionTitle}" (Section ${sectionNumber}). ${SITE.title}: ${SITE.subtitle}, ${SITE.version}.${locator} Accessed ${accessed}.`;
}
