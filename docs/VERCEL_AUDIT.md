# Auditoría de despliegue en Vercel

## Proyecto

Radio App — Streaming de radio mundial

## Framework

Astro 7 con Preact 10 como UI framework, Tailwind CSS v4, TypeScript.

## Versión de Node.js

El proyecto declara Node.js `22` en `.node-version` y `netlify.toml` (eliminado).

## Gestor de paquetes

npm con `package-lock.json` versionado.

## Comando de instalación

```bash
npm ci
```

## Comando de build

```bash
npm run build
```

El script ejecuta `astro build`.

## Carpeta de salida

```txt
dist/
```

## Variables de entorno

No se detectaron variables de entorno requeridas para build o runtime.

## Servicios externos

- Radio Browser API (pública, sin clave): `all.api.radio-browser.info`
- Streaming de audio directo desde URLs de estaciones (HTTPS)

## APIs

- `/api/stations.ts` — proxy server-side a Radio Browser API con caché en memoria
- `/api/image-proxy.ts` — proxy de imágenes de estaciones con protección SSRF

## Base de datos

No utiliza base de datos. Persistencia en `localStorage`.

## Adaptadores actuales

- **Antes:** `@astrojs/netlify` (eliminado)
- **Ahora:** `@astrojs/vercel` (instalado)

## Cambios realizados para migración

1. `npm remove @astrojs/netlify`
2. `npm install @astrojs/vercel`
3. `astro.config.mjs`: import y adapter cambiados de `netlify()` a `vercel()`
4. `netlify.toml`: eliminado
5. `.gitignore`: `/.netlify` reemplazado por `/.vercel`

## Riesgos

- Cache en memoria de `/api/stations.ts` es menos efectivo en Vercel (cold starts más frecuentes).
- Middleware de autenticación funciona pero es demostrativo (no producción).
- Streaming de audio es directo browser→estación, sin proxy de servidor.

## Decisión: compatible / compatible con cambios / no compatible

**Compatible con Vercel.** Requiere cambio de adaptador (Netlify → Vercel).
