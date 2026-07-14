# Despliegue en Vercel

## Proyecto

`radio-app-astro`

## Estado

- [x] Preview desplegada
- [x] Producción desplegada
- [x] Variables configuradas
- [ ] Dominio configurado
- [x] Pruebas completadas

## Configuración

| Campo | Valor |
|---|---|
| Framework | Astro |
| Root Directory | `./` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 22 |
| Gestor de paquetes | npm |

## URL de Producción

```txt
https://radio-app-astro.vercel.app
```

## Variables de entorno

No se requieren variables de entorno para el despliegue actual.

## Servicios externos

- Radio Browser API (pública, sin clave)
- Streaming de audio directo desde URLs de estaciones

## Pruebas realizadas

Comandos ejecutados localmente con Node.js `v22.23.1`:

```bash
npm ci
npm run build
```

Resultado: instalación y build completados correctamente con adaptador `@astrojs/vercel`.

## Limitaciones

- Cache en memoria menos efectivo que en Netlify (cold starts).
- Autenticación es demostrativa, no producción.
- No se configura dominio propio en esta etapa.

## Rollback

Revertir la Pull Request de migración y restaurar `@astrojs/netlify` y `netlify.toml`.

Para rollback desde CLI:

```bash
vercel rollback
```

## Última revisión

2026-07-14
