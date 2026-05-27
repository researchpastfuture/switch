// Section 11 — bill-template-generator. Selected provisions are assembled into sample text.
export interface BillProvision {
  id: string;
  label: string;
  text: string;
}

export interface BillData {
  titlePrefix: string;
  provisions: BillProvision[];
}

export const billTemplate: BillData = {
  titlePrefix: 'A BILL',
  provisions: [
    { id: 'definitions', label: 'Definitions', text: 'SECTION 1. DEFINITIONS. For purposes of this Act, the following terms shall apply as defined herein.' },
    { id: 'protection', label: 'Child protection mandate', text: 'SECTION 2. CHILD PROTECTION. Covered entities shall implement protective standards for minors as specified by the responsible agency.' },
    { id: 'reporting', label: 'Reporting requirements', text: 'SECTION 3. REPORTING. Covered entities shall report defined incidents within the prescribed timeframe.' },
    { id: 'funding', label: 'Funding authorization', text: 'SECTION 4. FUNDING. There are authorized to be appropriated such sums as may be necessary to carry out this Act.' },
    { id: 'oversight', label: 'Oversight & audit', text: 'SECTION 5. OVERSIGHT. The responsible agency shall conduct periodic audits and report findings.' },
    { id: 'enforcement', label: 'Enforcement', text: 'SECTION 6. ENFORCEMENT. Violations shall be subject to penalties established by the responsible agency.' },
  ],
};
