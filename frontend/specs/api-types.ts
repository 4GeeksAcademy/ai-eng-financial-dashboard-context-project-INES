/**
 * Type specs for backend API *responses* not yet consumed by the app
 * (`/api/metrics/facets`, `/api/metrics/alerts`, `/api/metrics/categories/top`).
 *
 * Every field name, type, and required/optional status below was verified
 * against the **live** OpenAPI schema (`GET /openapi.json`, backend running
 * via plain `uvicorn`, no Docker) on 2026-09-06 — not just against the
 * Python source. See ../../verification.md for exactly how.
 *
 * These are intentionally standalone: `frontend/specs/` is excluded from
 * `tsconfig.app.json`'s `include` (only `"src"` is compiled), so nothing
 * here is wired into the running app or re-uses `frontend/src/lib/financial-types.ts`.
 * `Category`/`OperationType`/`BusinessType` are re-declared below on
 * purpose. If any of these types gets connected to the UI, merge it into
 * `financial-types.ts` in the same change instead of importing across the
 * `specs/` boundary — see
 * .agents/rules/financial-movement-type-duplicated-python-typescript.md.
 */

/** One of the five fixed transaction categories the backend ever emits. */
export type Category =
  | 'suppliers'
  | 'sales'
  | 'operational'
  | 'administrative'
  | 'others'

/** Whether a movement is money coming in (`income`) or going out (`outcome`). */
export type OperationType = 'income' | 'outcome'

/** Which side of the business a movement belongs to. */
export type BusinessType = 'B2B' | 'B2C'

/**
 * Response shape of `GET /api/metrics/facets`.
 *
 * Backend model: `MetricsFacets` (`backend/app/routes.py:30-36`). All five
 * fields are `required` in the live OpenAPI schema — the backend never
 * omits any of them, even for an empty dataset (the mock generator always
 * produces 360 movements, so this endpoint never actually returns empty
 * arrays today).
 */
export interface FacetsResponse {
  /** Every distinct `operation_type` present in the current dataset. */
  operation_types: OperationType[]
  /** Every distinct `business_type` present in the current dataset. */
  business_types: BusinessType[]
  /** Every distinct `category` present in the current dataset. */
  categories: Category[]
  /**
   * Earliest `create_date` in the current dataset, as `YYYY-MM-DD`
   * (OpenAPI `format: date`). The dataset is a rolling window tied to the
   * server's system clock, not a fixed year — see
   * .agents/rules/mock-data-date-range-is-a-rolling-window.md before
   * assuming this value is stable across days.
   */
  min_date: string
  /** Latest `create_date` in the current dataset, as `YYYY-MM-DD`. */
  max_date: string
}

/**
 * One anomaly entry from `GET /api/metrics/alerts`.
 *
 * Backend model: `MetricsAlert` (`backend/app/routes.py:58-62`). The
 * backend only emits an entry for a period whose outcome exceeded the
 * running baseline by more than the request's `threshold`
 * (see `AlertsParams` in `./param-types.ts`) — periods below threshold are
 * simply absent, not included with a flag set to false.
 */
export interface AlertEntry {
  /**
   * The period this alert refers to, formatted according to the request's
   * `group_by`: `YYYY-MM-DD` (day), `YYYY-Www` with a zero-padded ISO week
   * (week, e.g. `2026-W05`), or `YYYY-MM` (month, the default).
   */
  period: string
  /** Total `outcome` amount recorded in this period. */
  outcome_total: number
  /**
   * Mean `outcome_total` of every period strictly before this one in the
   * response's chronological order — the first period in any response can
   * never itself be an alert, since it has no baseline yet.
   */
  baseline_average: number
  /**
   * How far `outcome_total` exceeded `baseline_average`, as a ratio
   * (e.g. `0.45` means 45% above baseline). Always strictly greater than
   * the request's `threshold`, by construction of the backend's detection
   * logic (`detect_outcome_alerts`, `backend/app/routes.py:219-240`).
   */
  increase_ratio: number
}

/**
 * Response shape of `GET /api/metrics/alerts`.
 *
 * The backend returns a bare JSON array
 * (`response_model=list[MetricsAlert]`, `backend/app/routes.py:342-359`) —
 * not an object wrapping a list, and not paginated. Can be an empty array
 * when no period crosses the threshold.
 */
export type AlertsResponse = AlertEntry[]

/**
 * One ranked entry from `GET /api/metrics/categories/top`.
 *
 * Backend model: `TopCategoryItem` (`backend/app/routes.py:45-48`).
 */
export interface CategoryEntry {
  /**
   * The category this entry ranks. `others` can appear for **either**
   * `operation_type` — it is not income-exclusive. Verified live:
   * `GET /api/metrics/categories/top?operation_type=outcome` returned
   * `others` as the top-ranked outcome category on 2026-09-06. See the
   * correction in .agents/rules/backend-data-model.md.
   */
  category: Category
  /** The operation type this ranking was computed for — echoes the request's `operation_type` param on every entry in the response. */
  operation_type: OperationType
  /** Sum of `amount` across every movement in this category, for the requested range and `operation_type`. */
  total_amount: number
}

/**
 * Response shape of `GET /api/metrics/categories/top`.
 *
 * Bare array (`response_model=list[TopCategoryItem]`,
 * `backend/app/routes.py:287-302`), sorted by `total_amount` descending,
 * length bounded by the request's `limit` param (see `TopCategoriesParams`
 * in `./param-types.ts` — backend enforces `1 <= limit <= 20`).
 */
export type TopCategoriesResponse = CategoryEntry[]
