# Nombre de la regla
`anonymous-docker-volume-can-leave-host-node-modules-empty`

## Alcance
Aplica cuando un agente va a correr `npx vitest`, `npx eslint`, o `npm run
build` directamente en el host (fuera del contenedor `frontend`) y obtiene
errores de módulo no encontrado.

## Justificación
Reproducido en esta sesión: `frontend/node_modules` existía en disco pero
con 0 archivos, rompiendo `vitest`/`eslint`/`vite` con
`ERR_MODULE_NOT_FOUND` — un error que aparenta ser de dependencias
corruptas o de una instalación fallida, cuando en realidad es un efecto
esperado del volumen anónimo declarado en `docker-compose.yml`.

## Evidencia
- `docker-compose.yml:8-10`:
  ```yaml
  volumes:
    - ./frontend:/app
    - /app/node_modules
  ```
  La segunda línea es un volumen anónimo que evita que el bind-mount del
  host (`./frontend:/app`) pise el `node_modules` instalado dentro del
  contenedor — pero como efecto colateral, el `node_modules` del **host**
  nunca lo puebla `docker compose up`.
- Verificado en esta sesión: `ls node_modules | wc -l` → `0` antes de
  correr `npm install` manualmente en el host; `npx vitest run` fallaba con
  `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite'` hasta
  corregirlo.

## Guía accionable específica para este proyecto
1. Si `npx vitest`/`npx eslint`/`npm run build` fallan con errores de
   módulo no encontrado en `frontend/`, correr `npm install` en
   `frontend/` desde el host **antes** de investigar el código — es casi
   seguro un síntoma de este volumen, no un bug real del proyecto.
2. No "arreglar" esto borrando la línea `/app/node_modules` del
   `docker-compose.yml` sin entender que rompería el hot-reload dentro del
   contenedor (el bind-mount `./frontend:/app` sobrescribiría el
   `node_modules` ya instalado en la imagen cada vez que el host no lo
   tenga poblado).
3. Si se agrega documentación de setup local, mencionar explícitamente que
   correr herramientas de Node fuera de Docker requiere un `npm install`
   manual — esto no está en `README.md` hoy.
