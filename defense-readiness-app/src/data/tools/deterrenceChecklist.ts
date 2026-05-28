// Section 3 — risk-assessment-checklist. Each checked item adds `weight` to the score.
export interface ChecklistItem {
  id: string;
  label: string;
  weight: number;
}

export interface ScoredChecklist {
  items: ChecklistItem[];
  bands: { min: number; label: string; note: string }[];
}

export const deterrenceChecklist: ScoredChecklist = {
  items: [
    { id: 'family-plan', label: 'Family has a discussed safety and communication plan', weight: 10 },
    { id: 'school-contact', label: 'Know the school\'s protection and reporting points of contact', weight: 10 },
    { id: 'online-rules', label: 'Household online-use rules and parental controls are in place', weight: 15 },
    { id: 'community-watch', label: 'Connected to a neighborhood or community watch network', weight: 15 },
    { id: 'reporting-knowledge', label: 'Know how to report exploitation or trafficking concerns', weight: 20 },
    { id: 'trusted-adults', label: 'Children can name several trusted adults', weight: 15 },
    { id: 'recovery-resources', label: 'Aware of local counseling / recovery resources', weight: 15 },
  ],
  bands: [
    { min: 0, label: 'Getting started', note: 'Pick two items below to address this week.' },
    { min: 40, label: 'Developing', note: 'A foundation is in place; close the remaining gaps.' },
    { min: 70, label: 'Prepared', note: 'Strong coverage — review and keep it current.' },
    { min: 95, label: 'Highly prepared', note: 'Comprehensive. Consider mentoring other families.' },
  ],
};
