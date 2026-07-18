import AsyncStorage from '@react-native-async-storage/async-storage';
import { Script } from '../types';

const SCRIPTS_KEY = 'teleprompter.scripts.v1';
const LAST_SCRIPT_KEY = 'teleprompter.lastScriptId.v1';

const WELCOME_SCRIPT = `Bienvenido a tu teleprompter.

Esta app es 100% gratuita: sin cuentas, sin límites de caracteres y sin suscripciones. Tus guiones se guardan solo en este teléfono.

Toca "Guiones" para crear tu primer guión, o el lápiz para editar este. En la próxima versión llegará el desplazamiento automático con velocidad ajustable, y después la cámara para grabarte mientras lees.

Escribe con frases cortas y claras: se leen mejor en pantalla.`;

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadScripts(): Promise<Script[]> {
  const raw = await AsyncStorage.getItem(SCRIPTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Script[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // dato corrupto: se reinicia con el guión de bienvenida
    }
  }
  const now = Date.now();
  const welcome: Script = {
    id: makeId(),
    title: 'Bienvenida',
    content: WELCOME_SCRIPT,
    createdAt: now,
    updatedAt: now,
  };
  await saveScripts([welcome]);
  await setLastScriptId(welcome.id);
  return [welcome];
}

export async function saveScripts(scripts: Script[]): Promise<void> {
  await AsyncStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

export async function getLastScriptId(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SCRIPT_KEY);
}

export async function setLastScriptId(id: string): Promise<void> {
  await AsyncStorage.setItem(LAST_SCRIPT_KEY, id);
}

export function createScript(title: string, content = ''): Script {
  const now = Date.now();
  return { id: makeId(), title, content, createdAt: now, updatedAt: now };
}

export function duplicateScript(script: Script): Script {
  const now = Date.now();
  return {
    ...script,
    id: makeId(),
    title: `${script.title} (copia)`,
    createdAt: now,
    updatedAt: now,
  };
}
