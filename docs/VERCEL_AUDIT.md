# Auditoría de despliegue en Vercel

## Framework

Astro 7 con Preact, Tailwind CSS 4, middleware SSR y endpoints API de Astro.

## Versión de Node.js

El proyecto declara Node.js `22.x` en `package.json`. Vercel debe construir con Node 22 para ser compatible con Astro 7.

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

## Carpeta de salida

Vercel detecta la salida generada por el adaptador `@astrojs/vercel`. No se debe configurar un output estático manual como `dist` para este proyecto SSR.

## Variables de entorno

Se requieren `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para auth y favoritos persistentes.

## Servicios externos

- Radio Browser API para búsqueda/listado de estaciones.
- Favicon/logo remoto de estaciones mediante image proxy.
- Streams de audio externos reproducidos directamente por el navegador.
- Supabase PostgreSQL para usuarios, sesiones y favoritos.

## APIs

| Endpoint local | Proveedor externo | Función | Riesgo | Mitigación actual |
|---|---|---|---|---|
| `/api/stations` | Radio Browser mirrors | Proxy controlado de búsqueda/listado | disponibilidad, timeout, rate limit | allowlist de paths, timeout, failover, límite `MAX_LIMIT` |
| `/api/image-proxy` | Favicons remotos | Proxy de imágenes | SSRF, tamaño, content-type | bloqueo hosts internos, límite 5MB, validación `image/*`, timeout |
| `/api/auth/*` | Supabase PostgreSQL | Auth server-side | secretos, sesiones | cookie `HttpOnly`, service role solo server-side |
| `/api/favorites` | Supabase PostgreSQL | Favoritos persistentes | acceso no autorizado | sesión validada server-side |

## Base de datos

Usa Supabase PostgreSQL en plan gratuito para usuarios, sesiones y favoritos.

## Riesgos

- Las funciones serverless de Vercel no deben usarse para retransmitir audio; el audio debe seguir reproduciéndose desde las URLs externas.
- La caché en memoria de `/api/stations` no debe considerarse persistente entre invocaciones serverless.
- La disponibilidad de auth y favoritos depende del proyecto Supabase y sus límites del plan gratuito.
- Los streams externos pueden fallar por mixed content, CORS, geobloqueo, MIME incorrecto o estaciones caídas.
- `npm audit` reporta vulnerabilidades en dependencias actuales; revisar antes de producción pública crítica.

## Decisión

Compatible con Vercel: requiere mantener SSR y usar el adaptador oficial `@astrojs/vercel`.
