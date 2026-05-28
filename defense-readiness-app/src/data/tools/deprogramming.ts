// Section 12 — deprogramming-pathway. A branching decision tree (self-guided, informational).
export interface PathwayNode {
  id: string;
  prompt: string;
  options?: { label: string; next: string }[];
  outcome?: string;
}

export interface PathwayData {
  start: string;
  disclaimer: string;
  nodes: Record<string, PathwayNode>;
}

export const deprogramming: PathwayData = {
  start: 'root',
  disclaimer:
    'This is a self-guided, informational pathway — not medical or psychological advice. For urgent concerns, contact a qualified professional.',
  nodes: {
    root: {
      id: 'root',
      prompt: 'Who is this pathway for?',
      options: [
        { label: 'Myself', next: 'self' },
        { label: 'A family member', next: 'family' },
      ],
    },
    self: {
      id: 'self',
      prompt: 'What feels most pressing right now?',
      options: [
        { label: 'Information overload / focus', next: 'focus' },
        { label: 'Beliefs I want to re-examine', next: 'beliefs' },
      ],
    },
    family: {
      id: 'family',
      prompt: 'Is the person open to talking?',
      options: [
        { label: 'Yes', next: 'open' },
        { label: 'Not yet', next: 'closed' },
      ],
    },
    focus: { id: 'focus', prompt: '', outcome: 'Start with a structured media break and a daily reflection routine; revisit the surveillance-detox checklist in Section 13.' },
    beliefs: { id: 'beliefs', prompt: '', outcome: 'Write down the claim, find primary sources on multiple sides, and discuss with a trusted mentor before concluding.' },
    open: { id: 'open', prompt: '', outcome: 'Lead with listening and shared activities; introduce resources gradually and without pressure.' },
    closed: { id: 'closed', prompt: '', outcome: 'Rebuild connection first; keep communication open and non-judgmental, and seek guidance from a counselor.' },
  },
};
