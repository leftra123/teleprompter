export type CameraFacing = 'front' | 'back';
export type CameraQuality = '720p' | '1080p';

/** Video grabado (en web: Blob + object URL). */
export interface RecordedVideo {
  /** Blob del video (tipado laxo para no exigir DOM en nativo). */
  blob: unknown;
  /** Object URL reproducible en <video>. */
  url: string;
  mimeType: string;
  /** Duración aproximada en segundos. */
  durationSec: number;
}

/** Interfaz imperativa que expone CameraStage vía ref. */
export interface CameraStageHandle {
  /** Inicia la grabación. Devuelve false si la cámara no está disponible. */
  startRecording(): boolean;
  /** Detiene la grabación y devuelve el video, o null si falló. */
  stopRecording(): Promise<RecordedVideo | null>;
}

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
