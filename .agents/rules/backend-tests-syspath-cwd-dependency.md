# Nombre de la regla
`backend-tests-depend-on-manual-syspath-insertion-and-cwd`

## Alcance
Aplica cuando un agente va a: (a) correr `pytest` desde un directorio
distinto a `backend/`, o (b) mover/renombrar `backend/tests/conftest.py` o
reorganizar la carpeta `backend/tests/`.

## Justificación
No hay instalación de paquete (`pip install -e .`) ni `pyproject.toml` en
`backend/` — la resolución de `from app...` en los tests depende de un hack
manual de `sys.path` con un índice de rutas relativo. Ejecutar `pytest`
desde el directorio equivocado, o reestructurar la carpeta, puede romper
las importaciones de forma confusa (el error sería `ModuleNotFoundError:
No module named 'app'`, sin pista de que la causa es de configuración de
paths y no del código de la app).

## Evidencia
- `backend/tests/conftest.py:1-7` completo:
  ```python
  import sys
  from pathlib import Path

  ROOT_DIR = Path(__file__).resolve().parents[1]
  if str(ROOT_DIR) not in sys.path:
      sys.path.insert(0, str(ROOT_DIR))
  ```
  `parents[1]` desde `backend/tests/conftest.py` resuelve a `backend/`.
- No existe `backend/pyproject.toml` ni `backend/setup.py` — confirmado por
  el listado completo de `backend/` (`Dockerfile`, `app/`, `requirements.txt`,
  `tests/`).
- `backend/app/__init__.py:1` es solo un comentario:
  `"Marks app as a package for imports in tests and runtime."` — documenta
  la intención pero no reemplaza una instalación real del paquete.

## Guía accionable específica para este proyecto
1. Siempre correr `pytest` con working directory en `backend/` (no en la
   raíz del repo, no dentro de `backend/tests/`). Verificado en esta sesión:
   `pytest -q` desde `backend/` → 15 passed.
2. Si se reorganiza la carpeta `tests/` (ej. se agregan subcarpetas
   `tests/unit/`, `tests/integration/`), actualizar el índice `parents[1]`
   en `conftest.py` en el mismo commit — es un valor frágil ante refactors
   de estructura, no se recalcula solo.
3. Si se decide resolver esto de raíz, la opción es agregar un
   `pyproject.toml` mínimo con `pip install -e .`, pero eso es un cambio de
   convención del proyecto — confirmarlo con el usuario antes de
   introducirlo, no como parte de un fix no relacionado.
