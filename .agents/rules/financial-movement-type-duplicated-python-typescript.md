# Nombre de la regla
`financial-movement-type-is-manually-duplicated-across-python-and-typescript`

## Alcance
Aplica a cualquier cambio de schema del backend: agregar/quitar/renombrar un
campo de `FinancialMovement` (o cualquier otro modelo de respuesta), o
agregar un valor a un `Literal`/enum (`Category`, `OperationType`,
`BusinessType`).

## Justificación
No hay generación de tipos compartida entre backend y frontend, pese a que
FastAPI expone `/openapi.json` automáticamente (no hay ningún script en
`frontend/package.json` que lo consuma). Cambiar el modelo en un lado sin el
otro no falla en build time del frontend — TypeScript no tiene forma de
saber que el contrato remoto cambió — falla en runtime, silenciosamente,
cuando el campo esperado no llega o llega con un tipo distinto.

## Evidencia
- `backend/app/routes.py:11-27` (Pydantic):
  ```python
  OperationType = Literal["income", "outcome"]
  Category = Literal["suppliers", "sales", "operational", "administrative", "others"]
  BusinessType = Literal["B2B", "B2C"]

  class FinancialMovement(BaseModel):
      create_date: date
      amount: float
      operation_type: OperationType
      category: Category
      business_type: BusinessType
  ```
- `frontend/src/lib/financial-types.ts:1-11` (TypeScript), definido de forma
  totalmente independiente, con los mismos literales repetidos a mano:
  ```ts
  export type OperationType = 'income' | 'outcome'
  export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'
  export type BusinessType = 'B2B' | 'B2C'

  export interface FinancialMovement {
    create_date: string // ISO date
    amount: number
    operation_type: OperationType
    category: Category
    business_type: BusinessType
  }
  ```
- No existe ningún script de codegen (`openapi-typescript`, `orval`, etc.)
  en `frontend/package.json`.

## Guía accionable específica para este proyecto
1. Cualquier cambio de schema debe editar **ambos** archivos
   (`backend/app/routes.py` y `frontend/src/lib/financial-types.ts`) en el
   mismo commit.
2. Correr `pytest -q` y `npx vitest run` después del cambio no es
   suficiente para detectar un olvido — ningún test hoy verifica que ambos
   lados coincidan (son suites independientes, cada una contra su propio
   lado). La verificación real es manual: diff de ambos archivos lado a
   lado antes de cerrar el cambio.
3. Si el proyecto crece y este tipo de desincronización empieza a doler,
   la opción de codegen desde `/openapi.json` existe sin cambios en el
   backend (FastAPI ya la expone) — pero no introducirla sin que el usuario
   lo pida explícitamente, es un cambio de tooling, no un fix puntual.
