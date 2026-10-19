# Frontend API reference

This document describes the HTTP API implemented in `backend/src`. It is intended for frontend integration.

## Connection and conventions

- Base URL: backend origin (local default `http://localhost:8000`). There is no API prefix.
- Send and receive JSON for JSON endpoints. For protected routes, send `Authorization: Bearer <accessToken>`.
- Dates are ISO-8601 strings. Transaction amounts and balances are integer amounts in the account's currency (for example, rupiah as whole units).
- Transaction types are `INCOME`, `EXPENSE`, or `TRANSFER` in persisted/list responses. AI parse inputs return lowercase `income`/`expense` types in the `data` payload.
- No CORS middleware is registered in the current app; cross-origin browser requests require backend CORS configuration or a same-origin proxy.

## Authentication flow

1. `POST /auth/register` creates an unverified user and emails a verification link. The link targets the frontend `/verify-email?token=...` route. Verification tokens expire after 1 hour.
2. The frontend sends that query token to `POST /auth/verify-email`. On success, store the returned `accessToken` as a bearer token. This token contains the user ID and expires in 7 days.
3. Alternatively, after verification, use `POST /auth/login`; it returns `token` (also a 7-day bearer token) and the user profile.
4. If login responds with `need-setup` (HTTP 400), send the existing login token with `POST /auth/setup` and then fetch `/auth/me` or `/dashboard`.
5. Include the bearer token on all `/transactions`, `/dashboard`, `/auth/me`, and `/auth/setup` requests. Missing, expired, or invalid tokens return HTTP 401; send the user to login.

Registration does not return a login token. Verification auto-issues a token under the key `accessToken`; login uses the key `token`.

## Endpoints

### Authentication

#### `POST /auth/register`

Request JSON:

```json
{ "name": "Ada", "email": "ada@example.com", "password": "at-least-8-chars" }
```

`name` must be a non-empty string, `email` valid email, and `password` at least 8 characters.

201 response: `{ "success": true, "message": "..." }`. Duplicate email: 400 `already-registered`. Server/email failure: 500 `server-error`.

#### `POST /auth/verify-email`

Request JSON: `{ "token": "<verification-token-from-email-link>" }`.

200 response: `{ "success": true, "message": "...", "accessToken": "<jwt>" }`. Missing token: 400 `token-not-found`; invalid/expired token: 400 `invalid-token`.

#### `POST /auth/resend-verification`

Request JSON: `{ "email": "ada@example.com" }`.

200 response: `{ "success": true, "message": "..." }`. Missing or unknown email: 400 `user-not-found`. Server/email failure: 500 `server-error`.

#### `POST /auth/login`

Request JSON: `{ "email": "ada@example.com", "password": "..." }`. Email must be valid; password must be non-empty.

200 response:

```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "<uuid>", "name": "Ada", "email": "ada@example.com",
    "currency": "IDR", "balance": 1000000
  },
  "needsSetup": false
}
```

`needsSetup` is false on successful login; users without currency or balance instead receive HTTP 400 `need-setup` and should continue to `/auth/setup` with the login token. Invalid credentials: 401 `invalid-credentials`; unverified email: 403 `email-not-verified`. Validation errors use the common validation shape below.

#### `GET /auth/me` (authenticated)

200 response: `{ "success": true, "message": "...", "user": { "id": "<uuid>", "name": "Ada", "email": "ada@example.com", "balance": 1000000, "currency": "IDR" } }`.

#### `POST /auth/setup` (authenticated)

Request JSON: `{ "currency": "IDR", "balance": 1000000 }`. `currency` must be a non-empty string; `balance` must be a JSON number >= 0. The backend stores the balance as an integer.

200 response: `{ "success": true, "message": "...", "user": { "id": "<uuid>", "name": "Ada", "email": "ada@example.com", "balance": 1000000, "currency": "IDR" } }`.

### Dashboard

#### `GET /dashboard/` (authenticated)

No query parameters are wired into the route. 200 response:

```json
{
  "success": true,
  "data": {
    "overview": {
      "currentBalance": { "amount": 1000000, "percentageChange": 0 },
      "expensesThisMonth": { "amount": 0, "percentageChange": 0 },
      "incomeThisMonth": { "amount": 0, "percentageChange": 0 }
    },
    "safeToSpend": null,
    "spendingHotspots": { "totalExpenses": 0, "categories": [{ "category": "Food", "amount": 0, "percentage": 0 }] },
    "incomeVsExpense": {
      "netSaved": 0,
      "weeklyData": [{ "week": "Week 1", "income": 0, "expense": 0 }],
      "avgInflowPerWeek": 0,
      "avgOutflowPerWeek": 0,
      "savingsRate": 0
    }
  }
}
```

The example numbers are illustrative. `safeToSpend` is `null` unless the account has a positive daily limit; otherwise it contains `{ dailyLimit, spentToday, left, percentageUsed }`. `weeklyData` always contains four week objects. Percentages are numeric values, usually rounded to one decimal place. Missing user: 404 `user-not-found`; other server failure: 500 `server-error`.

### Transactions

#### `GET /transactions/` (authenticated)

Optional query parameters:

| Name | Type / behavior |
|---|---|
| `page` | Integer >= 1; default 1 |
| `limit` | Integer 1–100; default 10 |
| `search` | Case-insensitive substring match on description |
| `startDate` | Date parseable by JavaScript; inclusive lower bound |
| `endDate` | Date parseable by JavaScript; inclusive upper bound |
| `type` | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `categories` | Comma-separated exact category values, e.g. `Food,Salary` |

200 response:

```json
{
  "success": true,
  "data": [{
    "id": "<uuid>", "date": "2026-10-01T00:00:00.000Z",
    "description": "Lunch", "category": "Food", "type": "EXPENSE", "amount": 50000
  }],
  "meta": { "currentPage": 1, "limit": 10, "totalItems": 1, "totalPages": 1 },
  "summary": { "income": 0, "expense": 50000, "net": -50000 }
}
```

Rows are ordered newest date first. The summary reflects the same filters as the list, across all matching rows (not just the current page); `TRANSFER` is excluded from income/expense totals. Invalid query values return HTTP 400 with the validation format below. Other failure: 500 `internal-server-error`.

#### `POST /transactions/parse` (authenticated)

Request JSON: `{ "text": "Paid 50k for lunch" }`. `text` must be non-empty (checked by the handler).

201 response: `{ "success": true, "message": "...", "data": [{ "type": "expense", "amount": 50000, "category": "Food", "description": "Lunch" }] }`.

The AI may extract multiple transactions; extracted rows are saved immediately for the authenticated user. No recognized transactions: HTTP 401 `transaction-not-found`. Empty text: 400 `form-validation`. Processing failure: 500 `server-error`.

#### `POST /transactions/parse-ocr` (authenticated, multipart)

Send `multipart/form-data` with a single file field named `receipt`. The file must have an `image/*` MIME type and be at most 5 MiB.

201 response: `{ "success": true, "message": "...", "data": [{ "type": "EXPENSE", "amount": 50000, "category": "Food", "description": "Cafe" }] }`. Receipt results are saved immediately with metadata source `ocr`.

Daily limit is 3 OCR transactions per user, counted since 00:00 UTC by number of saved OCR rows. At/over limit: 429 `limit-reached`. Missing image: 400 `bad-request`; no recognized transactions: 400 `extraction-failed`; processing failure: 500 `internal-server-error`. Invalid MIME type or oversize files are rejected by upload middleware (Multer error; no JSON error mapping is defined).

#### `PUT /transactions/:id` (authenticated)

Request JSON (all fields except `type` are required by validation):

```json
{
  "amount": 50000,
  "description": "Lunch",
  "date": "2026-10-01T12:30:00.000Z",
  "category": "Food",
  "metadata": { "note": "optional" },
  "type": "EXPENSE"
}
```

`amount` must be a number; `description` and `category` strings; `date` date-parseable; `metadata` optional JSON; optional `type` must be `INCOME`, `EXPENSE`, or `TRANSFER`.

Intended 200 response: `{ "success": true, "message": "...", "data": <updated transaction> }`. Missing transaction: 404 `not-found`; another user's transaction: 403 `access-denied`; validation failure: 400 `{ "errors": ... }`.

#### `DELETE /transactions/:id` (authenticated)

On success the route returns `{ "success": true, "data": <deleted transaction> }`. Missing transaction and unexpected deletion failures do not have a consistent response body/status in the current handler; handle non-2xx/empty responses defensively.

## Error formats

Most controller errors use HTTP status plus `{ "error": "<code>", "message": "<human-readable message>" }`. Auth middleware errors also include `success: false`. Body/query schema validation errors are HTTP 400 `{ "errors": { "field.path": ["message", ...] } }` (no `error` or `success` key). A non-Zod validation middleware failure returns `{ "error": "...", "message": "..." }` with status 500. Handle by status code and tolerate endpoint-specific variation.

Common auth middleware 401 response:

```json
{ "success": false, "error": "not-authenticated", "message": "..." }
```

Some controller handlers have inconsistent or incomplete error responses; in particular delete may return an empty response on missing records, and upload middleware errors are not normalized to JSON.
