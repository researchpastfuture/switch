// Section 13 — surveillance-detox-checklist. Categorized items; progress = % checked.
export interface DetoxItem {
  id: string;
  label: string;
}

export interface DetoxCategory {
  id: string;
  label: string;
  items: DetoxItem[];
}

export interface DetoxData {
  categories: DetoxCategory[];
}

export const detoxChecklist: DetoxData = {
  categories: [
    {
      id: 'accounts',
      label: 'Accounts',
      items: [
        { id: 'passwords', label: 'Use a password manager and unique passwords' },
        { id: '2fa', label: 'Enable two-factor authentication on key accounts' },
        { id: 'review-apps', label: 'Review and revoke unused app permissions' },
      ],
    },
    {
      id: 'devices',
      label: 'Devices',
      items: [
        { id: 'updates', label: 'Keep devices and software updated' },
        { id: 'location', label: 'Audit location-sharing settings' },
        { id: 'mic-cam', label: 'Review microphone and camera permissions' },
      ],
    },
    {
      id: 'data',
      label: 'Data footprint',
      items: [
        { id: 'data-brokers', label: 'Submit opt-outs to major data brokers' },
        { id: 'search', label: 'Use a privacy-respecting search engine' },
        { id: 'social-audit', label: 'Audit public information on social profiles' },
      ],
    },
  ],
};
