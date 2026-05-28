// Section 15 — metrics-dashboard. Progress = (current - baseline) / (target - baseline).
export interface Metric {
  id: string;
  label: string;
  baseline: number;
  current: number;
  target: number;
  unit: string;
}

export const metrics: Metric[] = [
  { id: 'schools', label: 'Schools with civic defense brigades', baseline: 0, current: 1200, target: 50000, unit: 'schools' },
  { id: 'nodes', label: 'Active watchtower nodes', baseline: 0, current: 35, target: 500, unit: 'nodes' },
  { id: 'rescues', label: 'Documented rescues / recoveries', baseline: 0, current: 480, target: 10000, unit: 'cases' },
  { id: 'families', label: 'Families completing preparedness program', baseline: 0, current: 9500, target: 250000, unit: 'families' },
  { id: 'stockpile', label: 'Strategic stockpile coverage', baseline: 5, current: 22, target: 90, unit: '%' },
];
