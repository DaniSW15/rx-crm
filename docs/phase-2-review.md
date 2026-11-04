# Revisión de ingeniería — 2 de noviembre de 2026

Alcance: frontend `rx-crm`, lectura del backend local `crm_backend`, peticiones
GET a `127.0.0.1:8000` y pruebas existentes sin PostgreSQL. Esta revisión no
modifica la configuración del backend, sesiones reales ni datos de negocio.

## 1. Autenticación e aislamiento: pendiente para el entorno en ejecución

Resultado observado en la API local:

| Ruta GET | Sin JWT | JWT inválido |
| --- | --- | --- |
| `/api/v1/auth/me` | 200 | 401 |
| `/api/v1/deals?limit=1&offset=0` | 200 | 401 |
| `/api/v1/pipelines` | 200 | 401 |
| `/api/v1/customers/` | 200 | 401 |
| `/api/v1/analytics/summary/` | 200 | 401 |
| `/api/v1/opportunities/` | 200 | 401 |

La configuración local de FastAPI carga `DEBUG=true`. En
`src/core/tenant.py`, `resolve_tenant_context` acepta una identidad demo con rol
ADMIN y permite `X-Tenant-ID` / `X-User-ID` cuando no hay Bearer en DEBUG.
Con `DEBUG=false`, el código exige JWT y sus pruebas comprueban el rechazo.
El acceso observado corresponde al modo demo local; no se examinó un despliegue
de producción.

Hay filtros de `tenant_id` en repositorios y validación de referencias de la
misma organización. Eso es evidencia parcial de aislamiento, no una certificación
integral. No se encontraron políticas RLS en las migraciones revisadas.

**Criterios de cierre:**

- Ejecutar la API sin autenticación demo y sin permitir que DEBUG active un
  bypass de seguridad en un despliegue real.
- Exigir 401 con `WWW-Authenticate: Bearer` para JWT ausentes, vacíos,
  inválidos, vencidos y revocados. Los headers de organización no autentican.
- En una base PostgreSQL de pruebas, usar dos organizaciones y JWT válidos:
  comprobar listados, métricas, relaciones, movimientos, actualización y borrado
  cruzados; las escrituras rechazadas no cambian datos ni crean auditoría.
- Añadir esa matriz a CI y al chequeo posterior al despliegue.

Comprobación reproducible, exclusivamente GET:

```bash
npm run verify:api-auth
API_AUTH_BASE_URL=http://localhost:5173 npm run verify:api-auth
```

El comando termina con código 1 si una ruta no responde 401 con challenge Bearer,
incluidos errores de conexión, redirecciones, 404 y 500. Un resultado correcto
solo demuestra rechazo de las peticiones probadas, no aislamiento entre JWT
válidos. No imprime cuerpos de respuesta ni credenciales.

Ejecución local: **24 comprobaciones, 18 fallos**. Los seis JWT inválidos se
rechazan; las peticiones sin JWT, con Bearer vacío y con headers demo obtienen
200. Es un fallo deliberadamente visible del criterio de autenticación del
entorno, independiente de que las pruebas de código con DEBUG desactivado pasen.

## 2. Concurrencia: falta protección entre vendedores

`MoveDealStageUseCase` ya persiste oportunidad e historial dentro de una unidad
de trabajo. `SqlAlchemyDealRepository.get_by_id` y `save` no incluyen un contador
de versión ni bloqueo explícito; `MoveDealStageRequest` solo recibe
`new_stage_id`. No hay evidencia de detección de una edición basada en datos
obsoletos. El bloqueo del Kanban solo coordina la interfaz de esa sesión.

**Contrato propuesto, todavía sin implementar:**

- Añadir `version` a la entidad, tabla y respuestas; exigir `expected_version`
  en mover, editar y eliminar.
- Actualizar atómicamente usando ID, organización, versión esperada y estado
  no eliminado; incrementar la versión y escribir auditoría en la misma
  transacción. Aplicarlo a todos los caminos de escritura de oportunidades.
- Ante versión obsoleta, responder 409 sin sobrescribir datos. React restaura
  su cambio optimista, consulta el estado actual y explica el conflicto.
- Probar en PostgreSQL que dos escrituras con la misma versión producen un
  éxito y un conflicto, con una sola transición confirmada. Probar también una
  edición obsoleta enviada después de otra ya confirmada.

SQLAlchemy ofrece contadores de versión, pero su uso requiere revisar cómo se
emiten las actualizaciones; una transacción por sí sola no detecta datos
obsoletos. [Documentación de versionado](https://docs.sqlalchemy.org/en/20/orm/versioning.html).

## 3. Sesión: falta recuperación segura después de recargar

Zustand conserva JWT y perfil en memoria. `ProtectedRoute` solo comprueba que
exista token; el cliente HTTP lanza errores sin coordinar expiración ni renovar
la sesión. Al recargar se pierde el token. El contrato actual de FastAPI no
ofrece refresh ni recuperación de sesión mediante cookie.

FastAPI ya implementa logout con revocación persistente de la huella del token.
El botón de React todavía solo limpia Zustand y TanStack Query: no llama a
`POST /api/v1/auth/logout/`.

**Estrategia propuesta:** access token breve en memoria y refresh opaco en
cookie `HttpOnly`, `Secure`, `SameSite=Lax` o `Strict`, preferentemente con API
en el mismo origen. Guardar la huella del refresh en el servidor, rotarlo y
detectar reutilización. Evitar persistir credenciales en localStorage o
sessionStorage. Proteger los endpoints que usan cookies frente a CSRF y validar
su origen. [Guía de sesiones de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

**Criterios de cierre:**

- Login crea la cookie y devuelve el access token. Un endpoint de refresh
  valida y rota la sesión, con caducidad absoluta e inactividad definidas.
- Al arrancar, React mantiene un estado de comprobación hasta recuperar sesión
  y perfil, antes de decidir si redirige al login.
- Coordinar un solo refresh ante varias respuestas 401; limitar el reintento y
  limpiar sesión y caché si la renovación falla. No reintentar escrituras por
  fallos de red de resultado desconocido.
- Logout revoca la sesión en el servidor y elimina la cookie. Si no hay red,
  distinguir salida local de revocación remota confirmada.
- Probar recarga, expiración, revocación, refresh simultáneos, rotación,
  reutilización, logout y cambio de organización.

## Estado comprobado y orden de trabajo

| Área | Resultado de esta revisión |
| --- | --- |
| Frontend automatizado | 25 pruebas pasan: 17 de Kanban/mutación y 8 del comprobador de autenticación |
| Backend sin PostgreSQL | 60 pruebas pasan: autenticación, wiring, revocación, transacciones, clientes y analítica |
| PostgreSQL HTTP | Hay pruebas con esquemas temporales; pendientes de ejecución con una conexión de pruebas explícita |
| DDD y transacciones | Ya existe separación de capas y unidad de trabajo; ampliar según los casos de uso |
| Auditoría | Historial de etapas existente; auditoría completa de operaciones pendiente |
| Oportunidades | API de creación, listado, actualización y borrado existente; completar UI y cobertura |
| Clientes y métricas | Backend y pruebas existentes; falta integrarlos en React |
| Sesión persistente y concurrencia de oportunidades | Pendientes |

Build de producción y ESLint pasan. Las pruebas PostgreSQL no se ejecutaron:
`TEST_DATABASE_URL` no está configurada. Comando usado para las 60 pruebas de
backend, desde `crm_backend`, sin escribir bytecode:

```bash
PYTHONDONTWRITEBYTECODE=1 DEBUG=false PYTHONPATH=.:tests .venv/bin/python -m unittest test_security test_wiring test_logout test_transactions test_customers test_analytics -q
```

Hallazgo adicional: `move-stage` llama a `deal.change_stage`, que cambia la etapa
sin actualizar `status` según `is_won_stage` / `is_lost_stage`. React predice
WON/LOST durante la actualización optimista y luego aplica el estado del servidor.
Hay que acordar el contrato de cierre y reapertura, incluido el motivo de pérdida,
para evitar una interfaz temporalmente contradictoria.

Orden propuesto para Fase 2: cerrar autenticación demo y validar dos tenants;
implementar versión y conflictos; integrar logout y recuperación segura de
sesión; completar auditoría y CI con PostgreSQL. Mantener funcionalidades CRM
y analítica como fases posteriores, aprovechando las APIs que ya existen.
