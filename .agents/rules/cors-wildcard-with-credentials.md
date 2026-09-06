# Nombre de la regla
`cors-wildcard-with-credentials-is-a-latent-risk-not-yet-triggered`

## Alcance
Aplica cuando un agente va a agregar cualquier forma de autenticación,
sesión, o cookie al backend, o cuando se le pide "revisar seguridad" del
proyecto.

## Justificación
La combinación `allow_origins=["*"]` + `allow_credentials=True` es inválida
según la especificación CORS/Fetch (los navegadores modernos la rechazan o
descartan las credenciales silenciosamente). Hoy no tiene impacto
observable porque no existe ningún mecanismo de autenticación en el
backend — pero es una bomba de tiempo si alguien agrega cookies/sesión sin
revisar este bloque primero.

## Evidencia
- `backend/app/main.py:7-13` completo:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- Confirmado por lectura completa de `backend/app/main.py` y
  `backend/app/routes.py`: no existe ningún `Depends(...)` de
  autenticación, ningún header `Authorization` manejado, ningún
  `Response.set_cookie(...)` en todo el backend.

## Guía accionable específica para este proyecto
1. Si se agrega cualquier forma de autenticación (JWT, sesión, cookie),
   este bloque de CORS debe revisarse en el **mismo cambio** — reemplazar
   `allow_origins=["*"]` por una lista explícita de orígenes permitidos
   (ej. `["http://localhost:5173"]` en dev).
2. No agregar auth y dejar este bloque "para después" — la combinación
   actual con `allow_credentials=True` ya está ahí esperando a que se
   introduzcan credenciales reales.
3. No eliminar `allow_credentials=True` como "fix rápido" sin confirmar que
   nada lo necesita — no hay evidencia de que se use hoy, pero tampoco de
   que quitarlo sea inocuo sin revisión.
