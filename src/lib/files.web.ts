import type { ExportResult, ImportedFile } from './files';

function sanitizeFilename(title: string): string {
  const clean = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return clean || 'guion';
}

/** Exporta un guión como .txt: hoja de compartir si existe, si no descarga. */
export async function exportScriptFile(title: string, content: string): Promise<ExportResult> {
  const name = `${sanitizeFilename(title)}.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  try {
    const file = new File([blob], name, { type: 'text/plain' });
    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean;
      share?: (d: { files: File[]; title?: string }) => Promise<void>;
    };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title });
      return 'shared';
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') return 'failed';
    // si share falla por otra razón, cae a descarga
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

/** Abre el selector de archivos y devuelve los .txt elegidos. */
export function pickTextFiles(): Promise<ImportedFile[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      const results: ImportedFile[] = [];
      for (const f of files) {
        try {
          const content = await f.text();
          results.push({ name: f.name.replace(/\.txt$/i, ''), content });
        } catch {
          // archivo ilegible: se omite
        }
      }
      resolve(results);
    };
    // Si el usuario cancela, no hay evento fiable: resolvemos vacío al volver el foco.
    const onFocus = () => {
      setTimeout(() => {
        window.removeEventListener('focus', onFocus);
        if (!input.files || input.files.length === 0) resolve([]);
      }, 500);
    };
    window.addEventListener('focus', onFocus);
    input.click();
  });
}

export const filesSupported = true;
