export interface ToolProps {
  data: unknown;
  config?: Record<string, unknown>;
  slug: string;
  title?: string;
  sectionNumber: number;
}

/** Shared "copy share link" action used by tools with shareable state. */
export function shareActionLabel(): string {
  return 'Copy share link';
}
