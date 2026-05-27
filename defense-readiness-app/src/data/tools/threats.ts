// Section 5 — threat-map. Markers placed on a simplified US map.
// x/y are PERCENTAGES (0-100) over the map image box. severity: 1 (low) - 3 (high).
export interface ThreatMarker {
  id: string;
  label: string;
  category: 'Border' | 'Cartel' | 'Internal';
  x: number;
  y: number;
  severity: 1 | 2 | 3;
  detail: string;
}

export interface ThreatMapData {
  categories: ThreatMarker['category'][];
  markers: ThreatMarker[];
}

export const threats: ThreatMapData = {
  categories: ['Border', 'Cartel', 'Internal'],
  markers: [
    { id: 'sw-border', label: 'Southwest border corridor', category: 'Border', x: 30, y: 78, severity: 3, detail: 'High-traffic crossing and smuggling corridor.' },
    { id: 'gulf', label: 'Gulf trafficking routes', category: 'Cartel', x: 47, y: 82, severity: 3, detail: 'Maritime and overland smuggling activity.' },
    { id: 'sw-distribution', label: 'Southwest distribution hub', category: 'Cartel', x: 33, y: 60, severity: 2, detail: 'Regional distribution and staging.' },
    { id: 'urban-ne', label: 'Northeast urban node', category: 'Internal', x: 82, y: 32, severity: 2, detail: 'Online recruitment and exploitation concern.' },
    { id: 'midwest', label: 'Midwest interstate hub', category: 'Internal', x: 60, y: 40, severity: 1, detail: 'Transit and logistics chokepoint.' },
    { id: 'west-coast', label: 'West coast port', category: 'Cartel', x: 9, y: 45, severity: 2, detail: 'Port-of-entry contraband risk.' },
  ],
};
