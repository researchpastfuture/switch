// Section 2 — concept-explorer. Expandable concepts with indicators.
export interface Concept {
  id: string;
  term: string;
  definition: string;
  indicators: string[];
}

export const concepts: Concept[] = [
  {
    id: 'fifth-gen',
    term: 'Fifth-Generation Warfare (5GW)',
    definition:
      'Conflict waged primarily through information, perception, and social influence rather than conventional force.',
    indicators: ['Narrative manipulation', 'Manufactured consensus', 'Erosion of shared reality'],
  },
  {
    id: 'attention-capture',
    term: 'Attention Capture',
    definition:
      'Designing systems to maximize engagement, redirecting focus away from deliberate, self-directed thought.',
    indicators: ['Compulsive use patterns', 'Infinite feeds', 'Reward-loop reinforcement'],
  },
  {
    id: 'mass-grooming',
    term: 'Mass Grooming (as described in the document)',
    definition:
      'The document\'s term for large-scale efforts it argues are aimed at shaping the beliefs and identities of young people.',
    indicators: ['Targeted messaging to minors', 'Normalization campaigns', 'Peer-pressure amplification'],
  },
  {
    id: 'identity-disruption',
    term: 'Identity Disruption',
    definition:
      'Pressures the document describes as destabilizing a young person\'s sense of self, faith, and country.',
    indicators: ['Confusion messaging', 'Isolation from family', 'Authority substitution'],
  },
];
