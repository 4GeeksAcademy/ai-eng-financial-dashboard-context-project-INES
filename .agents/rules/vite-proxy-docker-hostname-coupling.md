# Nombre de la regla
`vite-proxy-target-is-hardcoded-to-docker-compose-network`

## Alcance
Aplica cuando un agente va a: (a) correr el frontend con `npm run dev` fuera
de `docker compose`, o (b) diagnosticar un error de fetch fallido en la UI
(`"No se pudo cargar la informacion financiera..."`).

## Justificación
El único mecanismo de conexión frontend→backend en desarrollo asume que el
proceso corre dentro de la red de Docker Compose, donde `backend` es un
hostname resoluble. Fuera de ese contexto, el proxy falla de forma que
parece un problema de la API, no de configuración de red.

## Evidencia
- `frontend/vite.config.ts:11-16`:
  ```ts
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": { target: "http://backend:8000", changeOrigin: true },
    },
  },
  ```
- `backend` es el nombre del servicio declarado en
  `docker-compose.yml:14` (`backend:` bajo `services:`), no un hostname que
  resuelva vía DNS público o `/etc/hosts` por defecto.
- Mensaje de error real que verá el usuario si el fetch falla, ya escrito
  en `frontend/src/App.tsx:37`: `"No se pudo cargar la informacion
  financiera. Revisa la API de backend."` — no menciona nada sobre el proxy
  o la red de Docker, así que el mensaje no da la pista real.

## Guía accionable específica para este proyecto
1. Si un agente ve ese error en la UI (o un fetch fallido en la consola)
   corriendo fuera de `docker compose`, no diagnosticar como bug de CORS o
   de la lógica de `/api/metrics` — primero verificar si `backend` resuelve
   como hostname (`getent hosts backend`, o simplemente confirmar si el
   proceso corre dentro de la red de Compose).
2. La solución en ese caso es exportar `VITE_API_BASE_URL` apuntando al
   backend real (ej. `http://localhost:8000`, ver
   `frontend/.env.example`), **no** editar `target` en `vite.config.ts` —
   eso rompería el flujo de Docker Compose para todos los demás.
3. Ver también `.agents/rules/ports-and-environments.md` para el detalle
   completo de puertos y el gap de dev local ya documentado ahí.
