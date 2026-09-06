# Nombre de la regla
`backend-requirements-have-no-version-pins`

## Alcance
Aplica cuando un agente va a: (a) correr `pip install -r requirements.txt`
en un entorno nuevo, (b) recibir un error de dependencias inesperado al
instalar el backend, o (c) le piden "hacer el build reproducible" o
"productionizar" el backend.

## Justificación
Un build de hoy y uno de dentro de varios meses pueden traer versiones
mayores distintas de FastAPI/Pydantic/Uvicorn con breaking changes, y nada
en el repo lo detectaría automáticamente hasta que algo falle en runtime —
no hay lockfile equivalente a `package-lock.json` para Python en este repo.

## Evidencia
- `backend/requirements.txt` completo (6 líneas):
  ```
  fastapi
  uvicorn[standard]
  debugpy
  pytest
  pytest-cov
  httpx
  ```
  Ninguna línea tiene `==`, `>=` ni `~=`.
- Contraste directo: `frontend/package-lock.json` sí existe y fija
  versiones exactas de todo el árbol de dependencias de Node — la
  asimetría entre ambos lados del stack es real, no un patrón consistente
  del proyecto.

## Guía accionable específica para este proyecto
1. No agregar pins de versión unilateralmente "para arreglarlo" — es
   probable que sea deliberado en un proyecto de curso (siempre instalar
   última versión estable). No lo trates como un bug a corregir sin que se
   pida.
2. Si se pide explícitamente reproducibilidad o "productionizar": generar
   un `requirements.txt` con versiones exactas basado en un
   `pip freeze` corrido sobre un build ya verificado como funcional (ej. el
   entorno de esta sesión, donde `pytest -q` dio 15 passed), y confirmarlo
   con el usuario antes de commitear.
3. Si un `docker compose up --build` falla con un error de compatibilidad
   entre paquetes que antes funcionaba, sospechar primero de esta falta de
   pins antes de asumir un bug en el código propio del proyecto.
