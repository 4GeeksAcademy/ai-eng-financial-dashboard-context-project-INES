/**
 * Type specs for backend API *query parameters* not yet sent by the app,
 * paired with the response types in `./api-types.ts`.
 *
 * Verified against the **live** OpenAPI schema (`GET /openapi.json`) on
 * 2026-09-06 — see ../../verification.md for how the backend was run.
 *
 * All date fields are plain `YYYY-MM-DD` strings (OpenAPI `format: date`).
 * There is no `Date` object anywhere in this API's wire format on the way
 * in or out — every date is a string, matching how the rest of the app
 * already sends/receives dates.
 */

import type { OperationType } from './api-types'

/**
 * Optional date-range filter shared by every metrics endpoint that accepts
 * one. Both bounds are inclusive on the backend
 * (`filter_movements_by_date`, `backend/app/routes.py:107-122`) — a
 * movement dated exactly `start_date` or `end_date` is included, not
 * excluded.
 */
export interface DateRangeFilter {
  /**
   * Inclusive lower bound, `YYYY-MM-DD`. Omit (do not send the param) for
   * no lower bound — the backend treats a missing param as `None`, not as
   * an error.
   */
  start_date?: string
  /** Inclusive upper bound, `YYYY-MM-DD`. Omit for no upper bound. */
  end_date?: string
}

/**
 * Query parameters for `GET /api/metrics/alerts`.
 *
 * Scope note: the live endpoint also accepts `group_by`
 * (`'day' | 'week' | 'month'`, default `'month'`) and `business_type`
 * (`'B2B' | 'B2C' | null`) — both are real, working query params on the
 * backend but are **not modeled here**, because this type was scoped to
 * threshold + date range only. Treat `AlertsParams` as a partial request
 * shape, not the endpoint's full parameter set, until those two are added
 * on purpose.
 */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Minimum outcome-over-baseline increase ratio required for a period to
   * be reported as an alert (e.g. `0.3` = 30% above baseline). Backend
   * enforces `threshold >= 0`. Omit to use the backend's default of `0.3`.
   */
  threshold?: number
}

/**
 * Query parameters for `GET /api/metrics/categories/top`.
 *
 * Scope note: the live endpoint also accepts `business_type`
 * (`'B2B' | 'B2C' | null`) — a real, working query param on the backend
 * but **not modeled here**, for the same reason noted on `AlertsParams`.
 * Treat this as a partial request shape.
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * Which side of the ledger to rank categories for. Omit to use the
   * backend's default of `'outcome'`.
   */
  operation_type?: OperationType
  /**
   * Maximum number of ranked entries to return. Backend enforces
   * `1 <= limit <= 20` (`Query(default=5, ge=1, le=20)`,
   * `backend/app/routes.py:290`); a value outside that range gets a `422`
   * validation error, not a clamped result. Omit to use the default of `5`.
   */
  limit?: number
}
