# Radio App · Corrección de consola y revisión técnica

## Causas confirmadas

- `public/sw.js` devolvía `undefined` al fallar una petición sin entrada en caché. `FetchEvent.respondWith` exige una Response. Ahora todos los fallos interceptados devuelven una Response válida y las denegaciones de CacheStorage tampoco rompen la red.
- La captura muestra redirecciones a `vercel.com/sso-api`. Son de protección de despliegue, no del catálogo de radios. El manifiesto necesita `crossorigin="use-credentials"` para funcionar detrás de esa protección, incluso en el mismo origen.
- La caché PWA ahora se habilita explícitamente solo en producción. Las previews actualizan el worker antiguo a uno que deja pasar peticiones y retiran su registro sin borrar cookies/perfiles. No se cambió la protección de Vercel.
- La consulta del catálogo esperaba seis hosts hasta 12 s cada uno, mientras el cliente cortaba a los 10 s. El intento directo posterior podía multiplicar errores CORS y peticiones. Ahora hay dos puntos de acceso oficiales y un límite de 3 s por intento; el cliente concede 9 s.
- `astro build` transpila; no sustituye la comprobación de tipos. Había un usuario de diagnóstico con el contrato de autenticación anterior y contextos de pruebas incompletos sin tipado explícito. Ambos se corrigieron.

## Cambios

- Módulos separados: `useRadioPlayback`, `useStationDirectory`, `RadioPlayerPanel`, `StationArtwork`, normalización de datos, caché acotada y servicio de catálogo con transporte inyectable.
- Caché de consultas: fresca 5 minutos en servidor, último resultado válido hasta 1 hora durante fallos, 128 claves como máximo por instancia. Cliente: 3 minutos, 50 claves. Peticiones iguales simultáneas se comparten.
- Pausa de 20 s antes de volver a consultar un host fallido. Respuesta 503 honesta si no hay datos utilizables; no se disfraza un fallo como una lista vacía. Cache-Control CDN y Retry-After.
- Validación en tiempo de ejecución de JSON y URLs de streams; deduplicación por UUID; límites de filtros y uso de `hidebroken=true` en búsquedas. Los resultados históricos no garantizan disponibilidad actual de un stream.
- Los endpoints públicos del catálogo e imágenes no dependen de la sesión de Supabase ni refrescan cookies antes de respuestas potencialmente compartidas por CDN.
- El reproductor conserva un único audio, ignora rechazos de intentos antiguos y ofrece error tras 15 s de espera. No cambia automáticamente a otra emisora sin elección del usuario.
- Footer compartido: logo amarillo original suministrado por Gastón, servido con el componente Image de Astro (WebP y tamaños adecuados); `© año LuVal Studio · Radio App`. Espaciado explícito en el crédito. No contiene ninguna marca de Google.
- `strict: true`, `npm run check` (Astro + TypeScript), `npm run validate` y comprobación estricta en CI.

## Fuentes técnicas consultadas

- https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest
- https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- https://docs.radio-browser.info/

## Verificación

Validación local final: 94 pruebas correctas (Vitest 5.1.2), lint sin errores, Astro check y TypeScript sin errores ni advertencias (una sugerencia de estilo async), compilación correcta con Astro 7.4.13 y adaptador Vercel 11.0.22. Comprobación de formato de CI correcta. npm audit informa 0 vulnerabilidades después de actualizar dependencias y fijar path-to-regexp 6.3.0 para @vercel/routing-utils. La validación local se ejecutó en Node 24.18.1; el despliegue usa Node 22.x. Se agregaron regresiones para primer acceso sin conexión, CacheStorage denegado, redirecciones de login, fallback de catálogo, caché vencida y deduplicación. La revisión visual se realiza sobre el despliegue preview posterior a este commit; producción no se promueve.

## Límites

La caché en memoria no se comparte entre instancias de Vercel; el CDN ayuda, pero un arranque en frío sin conectividad puede devolver 503. Las emisoras son servicios externos: no es posible garantizar que todas estén siempre en línea. Las pruebas del service worker de producción son automatizadas; la revisión en navegador se realiza en la preview.
