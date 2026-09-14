# KickSplit frontend

## API configuration and deployment

For local development, leave `VITE_API_BASE_URL` unset or empty (see `.env.example`)
and run `npm run dev`. Requests use `/api` and the existing Vite proxy forwards
them to `http://localhost:8080`.

For production, set this environment variable in the frontend hosting service
before running `npm run build`:

```dotenv
VITE_API_BASE_URL=https://kicksplit.onrender.com
```

Use the backend origin without `/api`; the shared API helper adds that prefix.
Trailing slashes are removed. For example, groups requests go to
`https://kicksplit.onrender.com/api/groups`. Vite embeds the value at build time,
so rebuild after changing it. Publish the generated `dist` directory.
The backend must allow the deployed frontend origin through CORS.

Run `npm test`, `npm run lint`, and `npm run build` to validate the frontend.

## Vite template notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
