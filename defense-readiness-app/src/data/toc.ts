// Single ordered source of truth for the 17 sections.
// Navigation, the landing grid, prev/next, and the search index all derive from this.
// Each section's prose lives in content/sections/NN-slug.mdx (frontmatter must match).

export interface TocEntry {
  number: number;
  slug: string;
  title: string;
  summary: string;
  /** Discriminator consumed by ToolRenderer. Keep in sync with the .mdx frontmatter. */
  tool: string;
}

export const TOC: TocEntry[] = [
  {
    number: 1,
    slug: 'introduction',
    title: 'Introduction: The Strategic Crisis of the Republic',
    summary:
      'Frames the document: the case that the nation faces converging strategic, institutional, and cultural pressures requiring a coordinated response.',
    tool: 'readiness-gauge',
  },
  {
    number: 2,
    slug: 'war-on-the-mind',
    title: 'The War on the Mind: Fifth Generation Warfare and Mass Grooming',
    summary:
      'Defines fifth-generation warfare and information-age influence operations, and how they are described as targeting attention, belief, and identity.',
    tool: 'concept-explorer',
  },
  {
    number: 3,
    slug: 'child-centered-deterrence',
    title: 'Child-Centered Deterrence: The Forgotten War at Home',
    summary:
      'Presents a child-protection-centered view of deterrence and a self-assessment of community preparedness.',
    tool: 'risk-assessment-checklist',
  },
  {
    number: 4,
    slug: 'osint-humint-watchtower',
    title: 'OSINT + HUMINT as National Shield: The Watchtower Model',
    summary:
      'Describes combining open-source and human intelligence into a layered "watchtower" model, and lets you compose source coverage.',
    tool: 'intel-source-builder',
  },
  {
    number: 5,
    slug: 'border-cartel-internal',
    title: 'Border, Cartel, and Internal Threat Posture',
    summary:
      'Surveys the threat posture across border, cartel, and internal categories on an interactive map.',
    tool: 'threat-map',
  },
  {
    number: 6,
    slug: 'strategic-stockpiles',
    title: 'Strategic Stockpiles and Domestic Arsenal Zones',
    summary:
      'Covers strategic stockpiles and domestic arsenal planning, with a per-capita stockpile estimator.',
    tool: 'stockpile-planner',
  },
  {
    number: 7,
    slug: 'school-shields-brigades',
    title: 'School Shields and Civic Defense Brigades',
    summary:
      'Outlines school protection and civic defense brigade concepts, with a brigade composition planner.',
    tool: 'brigade-builder',
  },
  {
    number: 8,
    slug: 'national-rescue-operations',
    title: 'National Rescue Operations & Sanctuary Entry Protocol',
    summary:
      'Walks through a step-by-step rescue-operations and sanctuary-entry protocol you can track.',
    tool: 'protocol-stepper',
  },
  {
    number: 9,
    slug: 'faith-family-renewal',
    title: 'Faith, Family, and Cultural Renewal Doctrine',
    summary:
      'Presents the cultural renewal doctrine and lets you assemble a personal or community pledge.',
    tool: 'pledge-commitment-tracker',
  },
  {
    number: 10,
    slug: 'safe-usa-fund',
    title: 'SAFE-USA: Strategic Arsenal & Freedom Emergency Fund',
    summary:
      'Explains the proposed SAFE-USA fund and offers a notional budget allocation simulator.',
    tool: 'fund-allocation-simulator',
  },
  {
    number: 11,
    slug: 'legislative-framework',
    title: 'PDPC Legislative Framework & PAC-Enabled Mandates',
    summary:
      'Describes the legislative framework and generates a formatted sample-bill template from your selections.',
    tool: 'bill-template-generator',
  },
  {
    number: 12,
    slug: 'psychological-warfare-reversal',
    title: 'Psychological Warfare Reversal Programs (De-hypnosis, Deprogramming)',
    summary:
      'Presents reversal/recovery program concepts as a branching, self-guided pathway.',
    tool: 'deprogramming-pathway',
  },
  {
    number: 13,
    slug: 'surveillance-detox',
    title: 'Strategic Intelligence Reclamation and Surveillance Detox',
    summary:
      'Offers a categorized digital-hardening and "surveillance detox" checklist with progress tracking.',
    tool: 'surveillance-detox-checklist',
  },
  {
    number: 14,
    slug: 'watchtower-deployment',
    title: 'PDPC Watchtower Deployment Schedule and Global Expansion',
    summary:
      'Lays out the phased deployment schedule and expansion roadmap on an interactive timeline.',
    tool: 'deployment-timeline',
  },
  {
    number: 15,
    slug: 'restoration-metrics',
    title: 'National Restoration Metrics and Deterrence Benchmarks',
    summary:
      'Tracks restoration metrics and deterrence benchmarks on a baseline / current / target dashboard.',
    tool: 'metrics-dashboard',
  },
  {
    number: 16,
    slug: 'conclusion-covenant',
    title: 'Conclusion: A New Covenant for a Protected Republic',
    summary:
      'Concludes the document and lets you assemble a printable covenant from its principles.',
    tool: 'covenant-builder',
  },
  {
    number: 17,
    slug: 'appendices',
    title: 'Appendices: Threat Maps, Rescue Protocols, Sample Legislation',
    summary:
      'Reference appendix: downloadable assets and a searchable glossary of terms used throughout.',
    tool: 'appendix-explorer',
  },
];

export const TOC_BY_SLUG: Record<string, TocEntry> = Object.fromEntries(
  TOC.map((e) => [e.slug, e]),
);

export function neighbors(slug: string): { prev?: TocEntry; next?: TocEntry } {
  const i = TOC.findIndex((e) => e.slug === slug);
  return { prev: TOC[i - 1], next: TOC[i + 1] };
}
