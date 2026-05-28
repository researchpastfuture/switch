// Section 1 — readiness-gauge. Edit/add gauges; `value` and `target` are 0-100.
export interface ReadinessGauge {
  id: string;
  label: string;
  value: number;
  target: number;
  note?: string;
}

export const readiness: ReadinessGauge[] = [
  { id: 'strategic', label: 'Strategic Deterrence', value: 42, target: 90, note: 'Foreign-facing posture.' },
  { id: 'institutional', label: 'Institutional Trust', value: 35, target: 85 },
  { id: 'cultural', label: 'Cultural Cohesion', value: 38, target: 80 },
  { id: 'child', label: 'Child Protection', value: 30, target: 95, note: 'Central concern of the document.' },
  { id: 'industrial', label: 'Industrial Capacity', value: 55, target: 90 },
];
