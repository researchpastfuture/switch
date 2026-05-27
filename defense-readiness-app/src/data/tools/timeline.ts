// Section 14 — deployment-timeline. Phased milestones, filterable by region.
export interface Milestone {
  id: string;
  phase: string;
  period: string;
  region: string;
  title: string;
  detail: string;
}

export interface TimelineData {
  regions: string[];
  milestones: Milestone[];
}

export const timeline: TimelineData = {
  regions: ['National', 'Regional', 'Global'],
  milestones: [
    { id: 'p1', phase: 'Phase 1', period: '2026', region: 'National', title: 'Pilot watchtower nodes', detail: 'Stand up initial nodes and training.' },
    { id: 'p2', phase: 'Phase 2', period: '2027', region: 'Regional', title: 'Regional expansion', detail: 'Extend coverage to regional hubs.' },
    { id: 'p3', phase: 'Phase 3', period: '2028', region: 'National', title: 'Civic brigade integration', detail: 'Integrate school shields and brigades.' },
    { id: 'p4', phase: 'Phase 4', period: '2029', region: 'Global', title: 'Allied coordination', detail: 'Coordinate with allied partners.' },
    { id: 'p5', phase: 'Phase 5', period: '2030', region: 'Global', title: 'Full deployment', detail: 'Reach target deployment and benchmarks.' },
  ],
};
