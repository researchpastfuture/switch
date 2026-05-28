// Section 10 — fund-allocation-simulator. Allocate a notional 100% across buckets.
export interface FundBucket {
  id: string;
  label: string;
  defaultPct: number;
  color: string;
}

export interface FundData {
  totalLabel: string;
  buckets: FundBucket[];
}

export const fundBuckets: FundData = {
  totalLabel: 'SAFE-USA Emergency Fund',
  buckets: [
    { id: 'child', label: 'Child rescue & recovery', defaultPct: 30, color: '#2563eb' },
    { id: 'school', label: 'School shields', defaultPct: 20, color: '#16a34a' },
    { id: 'stockpiles', label: 'Strategic stockpiles', defaultPct: 15, color: '#d97706' },
    { id: 'intel', label: 'Watchtower / intelligence', defaultPct: 15, color: '#9333ea' },
    { id: 'recovery', label: 'Recovery programs', defaultPct: 10, color: '#dc2626' },
    { id: 'reserve', label: 'Emergency reserve', defaultPct: 10, color: '#0891b2' },
  ],
};
