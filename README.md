# RX CRM

## Interfaz del CRM

Diseño inspirado en la referencia visual: fondo azul, superficies malva, acentos
menta y navegación lateral. Incluye tema claro/oscuro, perfil, guía rápida y menú
móvil. La preferencia de tema se conserva localmente; las credenciales siguen
el comportamiento de autenticación documentado en la revisión de Fase 2.

- `/dashboard`: indicadores por moneda, distribución de oportunidades, clientes
  y oportunidades recientes, conectados a las APIs de FastAPI.
- `/deals`: tablero Kanban con el mismo sistema visual.
- `/customers`: directorio, búsqueda en la página actual y paginación.
- `/analytics`: distribución e importes separados por moneda.
- `/login`: acceso con estados de carga, errores y visibilidad de contraseña.

Los gráficos muestran el estado actual de la API. No se generan tendencias
mensuales ni se suman importes de diferentes divisas.

Las [capturas de escritorio](artifacts/crm-dashboard-desktop.png) y
[móvil](artifacts/crm-dashboard-mobile.png) usan datos de ejemplo identificados
en la imagen. El [informe de revisión en Chrome](artifacts/visual-qa.json)
registra las interacciones comprobadas con HTTP simulado, sin cambiar datos
del backend.

La [revisión de Fase 2](docs/phase-2-review.md) registra los hallazgos comprobados
de autenticación, concurrencia y sesión, junto con sus criterios de cierre.
`npm run verify:api-auth` comprueba por GET que las rutas privadas rechacen
credenciales ausentes o inválidas y señala cualquier acceso sin JWT.

## Kanban de oportunidades

Con el backend en `http://127.0.0.1:8000`, ejecuta `npm run dev`, inicia
sesión y abre **Oportunidades**. El proxy conserva el prefijo `/api/v1`.

- Arrastra desde **Mover** a otra etapa, incluso si la columna está vacía.
- Con teclado, enfoca **Mover**, pulsa Espacio o Enter, usa las flechas izquierda
  y derecha, y confirma con Espacio o Enter. Escape cancela.
- Al soltar se envía `POST /api/v1/deals/{id}/move-stage` con
  `{ "new_stage_id": "<id de la etapa>" }` y el token Bearer de la sesión.
- La tarjeta cambia de etapa inmediatamente. El estado OPEN/WON/LOST lo confirma
  el servidor; cambiar de columna no cierra la oportunidad automáticamente.
  Mientras se guarda, el tablero bloquea nuevos movimientos, la actualización
  manual y el selector de embudo. Un rechazo restaura la tarjeta y muestra el motivo.
- Soltar en la misma etapa, fuera de las columnas o cancelar no envía peticiones.
- Las oportunidades cerradas se muestran para consulta. Las tarjetas cuya etapa
  ya no está disponible aparecen en una sección separada para poder identificarlas.
- El tablero admite teclado y puntero, recupera el foco después de mover o
  restaurar una tarjeta y adapta las columnas a pantallas pequeñas y al tema oscuro.
- Los errores 401 ofrecen volver al login; los errores 403 y 409 explican el
  rechazo. Los fallos de red no repiten escrituras automáticamente. La página
  conserva datos ante errores temporales y oculta las tarjetas si la API rechaza
  el acceso con 401 o 403.

## Verificación

```bash
npm run format:check
npm run lint
npm test
npm run build
```

`npm run test:watch` ejecuta Vitest en modo interactivo. Las pruebas usan Testing
Library, sensores reales de dnd-kit y respuestas HTTP simuladas; no necesitan
el backend ni modifican sus datos. Cubren arrastre con puntero y teclado,
confirmación, rollback ante errores HTTP y de red, cancelación de consultas
pendientes y aislamiento de sesiones y organizaciones.

## Arquitectura y contratos

`app` compone providers, rutas y layout. Cada funcionalidad mantiene sus APIs,
hooks, tipos/modelos y componentes. Las dependencias entre funcionalidades usan
sus `index.ts` públicos; `shared` no depende de funcionalidades. ESLint comprueba
estos límites y evita React, Zustand y TanStack Query dentro de API/model/types.
Las páginas de entrada se componen directamente desde el router.

TypeScript tiene `strict` habilitado. Las respuestas de login, perfil, clientes,
analítica, pipelines y oportunidades se validan con Zod antes de llegar al caché.
El contrato de perfil usa `is_active: boolean`. Las funciones HTTP reciben token
y señal de cancelación; los hooks coordinan sesión y estado remoto.

El Kanban carga 50 oportunidades por petición y permite **Cargar más
oportunidades**.
Los conteos corresponden a las tarjetas cargadas. Una página de 50 permite
consultar la siguiente; una página más corta termina la carga. Se deduplican IDs
entre páginas. El caché paginado conserva todas las páginas al mover o restaurar
una tarjeta. El backend debe mantener un orden estable para su paginación por
offset; la deduplicación no garantiza una instantánea ante cambios concurrentes.

**Cerrar sesión** envía `POST /api/v1/auth/logout/` con el JWT capturado, elimina
el acceso local y limpia el caché inmediatamente. El login distingue cierre
confirmado de revocación no confirmada por red, timeout o error del servidor.
La petición tiene un límite de ocho segundos y no se repite automáticamente.
Las respuestas tardías no modifican una sesión nueva. El access token continúa
en memoria: refresh y recuperación tras recarga requieren un contrato adicional
de backend y no están implementados en esta entrega.

El [informe de arquitectura](docs/architecture-review.md) registra los cinco
hallazgos originales y sus correcciones. `npm run format` aplica Prettier.

## Pruebas de navegador y CI

```bash
npx playwright install chromium
npm run test:e2e
```

Si ya tienes Chrome instalado, también puedes ejecutar:

```bash
PLAYWRIGHT_CHROME_CHANNEL=chrome npm run test:e2e
```

Playwright inicia y detiene Vite en `127.0.0.1:4173`. Sus pruebas interceptan
HTTP con datos de ejemplo: verifican login, 51 oportunidades, movimiento con
teclado, rollback ante 409, logout remoto y navegación móvil. No requieren
credenciales reales ni escriben datos en FastAPI. No prueban la revocación ni
el aislamiento del servidor real.

`.github/workflows/ci.yml` comprueba formato, lint, pruebas, build y navegador en
push y pull requests. Para validar el servidor desplegado por separado, ejecuta
`npm run verify:api-auth` y las pruebas de integración propias del backend.
