/**
 * Variante NATIVA (stub): exportar/importar con el sistema de archivos
 * nativo llega en F5 (expo-sharing / expo-document-picker).
 * En web se usa files.web.ts.
 */

export type ExportResult = 'shared' | 'downloaded' | 'failed';

export interface ImportedFile {
  name: string;
  content: string;
}

export async function exportScriptFile(
  _title: string,
  _content: string,
): Promise<ExportResult> {
  return 'failed';
}

export async function pickTextFiles(): Promise<ImportedFile[]> {
  return [];
}

export const filesSupported = false;
