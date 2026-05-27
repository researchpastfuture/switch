// Section 4 — intel-source-builder. Toggle sources; coverage is computed across categories.
export interface IntelSource {
  id: string;
  name: string;
  kind: 'OSINT' | 'HUMINT';
  category: string;
  description: string;
}

export interface IntelSourceSet {
  categories: string[];
  sources: IntelSource[];
}

export const intelSources: IntelSourceSet = {
  categories: ['Public web', 'Social', 'Community', 'Field reports', 'Records'],
  sources: [
    { id: 'news', name: 'News & public records', kind: 'OSINT', category: 'Public web', description: 'Open reporting and published filings.' },
    { id: 'social', name: 'Social media monitoring', kind: 'OSINT', category: 'Social', description: 'Public posts and trend signals.' },
    { id: 'forums', name: 'Open forums & boards', kind: 'OSINT', category: 'Social', description: 'Publicly accessible discussion spaces.' },
    { id: 'tips', name: 'Community tip line', kind: 'HUMINT', category: 'Community', description: 'Reports from residents and volunteers.' },
    { id: 'liaisons', name: 'Faith & civic liaisons', kind: 'HUMINT', category: 'Community', description: 'Trusted local relationships.' },
    { id: 'field', name: 'Field observers', kind: 'HUMINT', category: 'Field reports', description: 'On-the-ground first-hand accounts.' },
    { id: 'registry', name: 'Public registries', kind: 'OSINT', category: 'Records', description: 'Searchable official databases.' },
  ],
};
