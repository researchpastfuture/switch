// Section 16 — covenant-builder. Selectable principles -> printable covenant.
export interface CovenantPrinciple {
  id: string;
  text: string;
}

export interface CovenantData {
  preamble: string;
  principles: CovenantPrinciple[];
}

export const covenant: CovenantData = {
  preamble: 'We affirm a renewed covenant for a protected republic, and commit to:',
  principles: [
    { id: 'children', text: 'Place the safety of children at the center of public life.' },
    { id: 'family', text: 'Strengthen families as the foundation of community.' },
    { id: 'truth', text: 'Defend truth, discernment, and open inquiry.' },
    { id: 'service', text: 'Serve our neighbors and communities directly.' },
    { id: 'vigilance', text: 'Remain vigilant sentinels, not passive spectators.' },
    { id: 'renewal', text: 'Pursue cultural and spiritual renewal.' },
  ],
};
