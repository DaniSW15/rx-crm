# RX CRM

La [revisión de Fase 2](docs/phase-2-review.md) registra los hallazgos comprobados
de autenticación, concurrencia y sesión, junto con sus criterios de cierre.
`npm run verify:api-auth` comprueba por GET que las rutas privadas rechacen
credenciales ausentes o inválidas; falla deliberadamente con autenticación demo.

## Kanban de oportunidades

Con el backend en `http://127.0.0.1:8000`, ejecuta `npm run dev`, inicia
sesión y abre **Oportunidades**. El proxy conserva el prefijo `/api/v1`.

- Arrastra desde **Mover** a otra etapa, incluso si la columna está vacía.
- Con teclado, enfoca **Mover**, pulsa Espacio o Enter, usa las flechas izquierda
  y derecha, y confirma con Espacio o Enter. Escape cancela.
- Al soltar se envía `POST /api/v1/deals/{id}/move-stage` con
  `{ "new_stage_id": "<id de la etapa>" }` y el token Bearer de la sesión.
- La tarjeta cambia de etapa y estado inmediatamente. Mientras se guarda, el
  tablero bloquea nuevos movimientos. La respuesta del servidor confirma los
  datos; un rechazo restaura la tarjeta y muestra el motivo.
- Soltar en la misma etapa, fuera de las columnas o cancelar no envía peticiones.

## Verificación

```bash
npm test
npm run lint
npm run build
```

`npm run test:watch` ejecuta Vitest en modo interactivo. Las pruebas usan Testing
Library, sensores reales de dnd-kit y respuestas HTTP simuladas; no necesitan
el backend ni modifican sus datos. Cubren arrastre con puntero y teclado,
confirmación, rollback ante errores HTTP y de red, cancelación de consultas
pendientes y aislamiento de sesiones y organizaciones.

## Plantilla React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
