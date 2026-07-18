# Cómo probar la app en tu iPhone (F1)

## Requisitos (una sola vez)
1. En tu Mac: tener Node.js instalado (`node -v` en Terminal; si no está, descárgalo de https://nodejs.org, versión LTS).
2. En tu iPhone: instalar **Expo Go** desde el App Store (gratis).
3. Mac y iPhone conectados a la **misma red Wi-Fi**.

## Cada vez que quieras probar
```bash
cd ~/Documents/01-Proyectos-Dev/personal/teleprompter
npm install        # solo la primera vez, o cuando cambien dependencias
npx expo start
```
Aparece un código QR en la terminal. Escanéalo con la cámara del iPhone → se abre en Expo Go.

Los cambios de código se reflejan al instante en el teléfono (recarga automática).

## Qué incluye F1
- Prompter de pantalla completa (fondo negro, texto grande) con desplazamiento automático básico: play/pausa y velocidad 1–10.
- Lista de guiones: crear, seleccionar, editar, duplicar, eliminar. Sin límite de caracteres.
- Editor con guardado automático (todo local en el teléfono).
- Guión de bienvenida precargado la primera vez.

## Qué viene después
- **F2:** scroll profesional (animación nativa, gestos), espejo, fuente/alineación, área de texto y transparencia, guía de lectura.
- **F3:** cámara frontal/trasera + grabación con cuenta regresiva y cronómetro.

## Si algo falla
- "Unable to connect": revisa que Mac y iPhone estén en la misma Wi-Fi, o corre `npx expo start --tunnel`.
- Errores raros tras actualizar: borra caché con `npx expo start -c`.
