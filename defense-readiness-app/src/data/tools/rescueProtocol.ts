// Section 8 — protocol-stepper. Ordered steps; each can be checked off.
export interface ProtocolStep {
  id: string;
  title: string;
  detail: string;
}

export interface ProtocolData {
  steps: ProtocolStep[];
}

export const rescueProtocol: ProtocolData = {
  steps: [
    { id: 'intake', title: 'Intake & verification', detail: 'Confirm the report and document the situation through proper channels.' },
    { id: 'coordinate', title: 'Coordinate with authorities', detail: 'Engage law enforcement and authorized partners before any action.' },
    { id: 'assess', title: 'Assess safety & risk', detail: 'Evaluate risk to the individual and responders.' },
    { id: 'secure', title: 'Secure sanctuary placement', detail: 'Identify a vetted, lawful safe placement.' },
    { id: 'transport', title: 'Transport under protocol', detail: 'Move only with authorized personnel and documentation.' },
    { id: 'care', title: 'Stabilize & provide care', detail: 'Medical, trauma-informed, and basic-needs support.' },
    { id: 'followup', title: 'Follow-up & casework', detail: 'Ongoing casework, recovery resources, and review.' },
  ],
};
