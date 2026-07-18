/**
 * Mantiene la pantalla encendida mientras el prompter corre o se graba
 * (Screen Wake Lock API; iOS Safari 16.4+). Se re-adquiere al volver a
 * la app si el sistema lo liberó.
 */

let sentinel: { release(): Promise<void> } | null = null;
let wanted = false;
let listenerInstalled = false;

async function acquire(): Promise<void> {
  const wl = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<any> } })
    .wakeLock;
  if (!wl) return;
  try {
    sentinel = await wl.request('screen');
  } catch {
    sentinel = null; // batería baja u otra restricción: no es crítico
  }
}

function installListener(): void {
  if (listenerInstalled) return;
  listenerInstalled = true;
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible' && !sentinel) acquire();
  });
}

export function setKeepAwake(active: boolean): void {
  installListener();
  wanted = active;
  if (active && !sentinel) {
    acquire();
  } else if (!active && sentinel) {
    sentinel.release().catch(() => {});
    sentinel = null;
  }
}
