# Cómo probar la app (flujo sin npm en tu Mac)

## Probar en el iPhone — 30 segundos

1. Abre en Safari: **https://leftra123.github.io/teleprompter/**
2. Toca el botón Compartir (cuadrado con flecha) → **Agregar a pantalla de inicio**.
3. Se instala como app con su propio ícono, pantalla completa y funciona sin conexión una vez cargada. Los guiones se guardan en el teléfono.

Cada vez que se publique una versión nueva, basta abrir la app de nuevo (o recargar) para recibirla — misma URL siempre.

## Cómo funciona el flujo de trabajo

- **Tu Mac** solo guarda el código fuente (esta carpeta). No necesita Node, npm ni ninguna herramienta.
- **Claude (entorno cloud)** compila, prueba y publica. Tú das órdenes en el chat.
- **GitHub (leftra123/teleprompter)** guarda el código en `main` y la app publicada en `gh-pages`.
- **GitHub Pages** sirve la app en la URL de arriba, gratis.

```
Orden en el chat → Claude programa y compila (cloud) → push a GitHub
       → GitHub Pages actualiza la URL → pruebas en el iPhone
       → copia del código sincronizada a esta carpeta del Mac
```

## Estado del proyecto

- **F1** ✅ Prompter con auto-scroll básico (play/pausa, velocidad 1–10), guiones ilimitados con guardado local, editor con autoguardado. Publicado como PWA.
- **F2** Scroll profesional, espejo H/V, fuente, alineación, área de texto, transparencia, guía de lectura.
- **F3** Cámara + grabación (en web usa la cámara del navegador; la calidad plena llegará con la app nativa en F5).
- **F4** Pulido y exportar/importar guiones.
- **F5** Apps nativas iOS/Android con EAS Build (compilación también en la nube, sin npm en tu Mac).

## Notas

- El repositorio en GitHub debe seguir **público** para que Pages sea gratis.
- El token de acceso que generaste expira en 7 días; para publicar después de esa fecha habrá que generar uno nuevo (mismos pasos).
