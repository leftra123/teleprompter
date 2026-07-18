import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  /** Tamaño de fuente del prompter (pt). */
  fontSize: number;
  /** Alineación del texto. */
  align: 'left' | 'center' | 'right';
  /** Espejo horizontal (para vidrio de teleprompter). */
  mirrorH: boolean;
  /** Espejo vertical. */
  mirrorV: boolean;
  /** Alto del área de texto como % de la pantalla (30–100). */
  areaPct: number;
  /** Opacidad del fondo del área de texto (0–100). */
  bgOpacity: number;
  /** Fondo claro (blanco) en vez de oscuro. */
  bgLight: boolean;
  /** Guía de lectura (indicador lateral). */
  guide: boolean;
  /** Velocidad de desplazamiento (1–10). */
  speed: number;
}

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 34,
  align: 'left',
  mirrorH: false,
  mirrorV: false,
  areaPct: 45,
  bgOpacity: 50,
  bgLight: false,
  guide: false,
  speed: 4,
};

const SETTINGS_KEY = 'teleprompter.settings.v1';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // dato corrupto → valores por defecto
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
