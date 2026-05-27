// Open a clean, print-ready window for a generated artifact (bill, pledge, covenant, dossier).
const PRINT_CSS = `
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #111;
         max-width: 720px; margin: 2rem auto; padding: 0 1.5rem; }
  h1 { font-size: 1.6rem; } h2 { font-size: 1.2rem; margin-top: 1.5rem; }
  ul { padding-left: 1.2rem; } li { margin: 0.3rem 0; }
  .meta { color: #555; font-size: 0.85rem; margin-bottom: 1.5rem; }
  pre { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.9rem; }
  @media print { body { margin: 0; } }
`;

export function printDocument(title: string, innerHtml: string): void {
  if (typeof window === 'undefined') return;
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) {
    alert('Please allow pop-ups to print or save this as a PDF.');
    return;
  }
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>` +
      `<style>${PRINT_CSS}</style></head><body>${innerHtml}</body></html>`,
  );
  w.document.close();
  w.focus();
  // Give the new document a tick to render before invoking print.
  setTimeout(() => w.print(), 250);
}
