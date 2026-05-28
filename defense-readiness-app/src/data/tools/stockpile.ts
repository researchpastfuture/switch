// Section 6 — stockpile-planner. Recommended quantity = population * perThousand / 1000.
export interface StockpileItem {
  id: string;
  label: string;
  unit: string;
  perThousand: number; // recommended units per 1,000 people
}

export interface StockpileData {
  defaultPopulation: number;
  items: StockpileItem[];
}

export const stockpile: StockpileData = {
  defaultPopulation: 50000,
  items: [
    { id: 'water', label: 'Emergency water reserve', unit: 'gal', perThousand: 3000 },
    { id: 'food', label: 'Shelf-stable meals', unit: 'meals', perThousand: 9000 },
    { id: 'medical', label: 'Trauma / medical kits', unit: 'kits', perThousand: 40 },
    { id: 'power', label: 'Backup generators', unit: 'units', perThousand: 2 },
    { id: 'comms', label: 'Field radios', unit: 'units', perThousand: 15 },
    { id: 'fuel', label: 'Reserve fuel', unit: 'gal', perThousand: 500 },
  ],
};
