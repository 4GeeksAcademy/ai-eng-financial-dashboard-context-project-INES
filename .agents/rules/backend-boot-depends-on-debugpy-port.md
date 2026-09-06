# Nombre de la regla
`backend-boot-depends-on-debugpy-binding-port-5678`

## Alcance
Aplica cuando el backend "no arranca" o el contenedor `backend` de
`docker compose` sale inmediatamente después de iniciar.

## Justificación
El comando de arranque del contenedor backend no tiene una ruta sin
debugger. Si `debugpy` no puede bindear el puerto 5678 (ej. porque otro
proceso/contenedor ya lo usa), el síntoma visible puede confundirse con un
problema de la aplicación FastAPI, cuando en realidad no llegó a ejecutarse
`uvicorn`.

## Evidencia
- Único `CMD` de `backend/Dockerfile:12`:
  ```dockerfile
  CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
  ```
- No existe un segundo `CMD`, variante de build, ni argumento condicional en
  el Dockerfile que permita saltarse `debugpy`.
- `docker-compose.yml:18-20` expone explícitamente el puerto 5678 además del
  8000, confirmando que el debugger es parte del flujo estándar, no un
  modo opcional.

## Guía accionable específica para este proyecto
1. Si un agente ve que el backend falla al arrancar y el log menciona el
   puerto 5678, verificar primero si ese puerto ya está ocupado en el host
   (`lsof -i :5678` o `docker ps` buscando otro contenedor que lo use) antes
   de investigar `main.py`/`routes.py`.
2. No agregar lógica de aplicación nueva asumiendo que se puede "probar
   rápido" corriendo el Dockerfile tal cual en paralelo a otra instancia del
   mismo proyecto — el puerto de debug fijo (5678) hace que dos instancias
   del backend en el mismo host/red choquen.
3. Si se necesita un modo sin debugger (ej. para CI), no editar el
   `CMD` existente — proponer un `Dockerfile` o `docker-compose.override.yml`
   separado, y confirmarlo con el usuario antes de introducir esa
   bifurcación.
