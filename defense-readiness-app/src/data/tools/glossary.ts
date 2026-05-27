// Section 17 — appendix-explorer + glossary. Downloadable assets + searchable terms.
export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface AppendixAsset {
  id: string;
  label: string;
  description: string;
  href: string; // place files in /public
}

export interface AppendixData {
  assets: AppendixAsset[];
  glossary: GlossaryTerm[];
}

export const glossary: AppendixData = {
  assets: [
    { id: 'threat-maps', label: 'Threat Maps (reference)', description: 'See the interactive map in Section 5.', href: '/sections/border-cartel-internal' },
    { id: 'rescue-protocol', label: 'Rescue Protocol (reference)', description: 'See the protocol stepper in Section 8.', href: '/sections/national-rescue-operations' },
    { id: 'sample-legislation', label: 'Sample Legislation (reference)', description: 'See the bill generator in Section 11.', href: '/sections/legislative-framework' },
  ],
  glossary: [
    { term: '5GW', definition: 'Fifth-generation warfare — conflict waged through information and perception.' },
    { term: 'OSINT', definition: 'Open-source intelligence — information gathered from publicly available sources.' },
    { term: 'HUMINT', definition: 'Human intelligence — information gathered through interpersonal contact.' },
    { term: 'Watchtower Model', definition: 'The document\'s layered approach combining OSINT and HUMINT.' },
    { term: 'SAFE-USA', definition: 'The proposed Strategic Arsenal & Freedom Emergency Fund.' },
    { term: 'Civic Defense Brigade', definition: 'A community-based protection and preparedness group described for schools.' },
    { term: 'Sanctuary Entry Protocol', definition: 'The described step-by-step process for safe placement during rescue operations.' },
  ],
};
