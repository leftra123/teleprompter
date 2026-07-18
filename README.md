# Teleprompter

App de teleprompter con grabación de video — **100% gratuita**: sin cuentas, sin límite de caracteres, sin suscripciones. Los guiones se guardan localmente en el dispositivo.

## Stack

- **React Native + Expo (SDK 57)** con TypeScript — una base de código para iOS, Android y web.
- **Versión de prueba:** PWA publicada en GitHub Pages (rama `gh-pages`).
- **Versión final:** apps nativas para App Store / Play Store vía EAS Build (misma base de código).

## Estructura

```
App.tsx                  # raíz: estado global + modales
src/screens/             # Prompter, Guiones, Editor
src/lib/storage.ts       # persistencia local (AsyncStorage)
src/lib/confirm.ts       # confirmaciones multiplataforma
scripts/pwa-patch.js     # post-proceso del export web (PWA)
```

## Build web

```bash
npm install
npm run build     # expo export -p web + parche PWA → dist/
```

## Hoja de ruta

- **F1** ✅ Esqueleto: prompter con auto-scroll básico, guiones con guardado local, editor.
- **F2** ✅ Prompter profesional: scroll suave (rAF) con pausa al final, espejo H/V, fuente y alineación, área de texto con opacidad y fondo negro/blanco, guía de lectura, ajustes persistentes.
- **F3** Cámara frontal/trasera + grabación con cuenta regresiva y cronómetro.
- **F4** Pulido: exportar/importar guiones, ajustes persistentes, rendimiento.
- **F5** Publicación en tiendas (EAS Build).
