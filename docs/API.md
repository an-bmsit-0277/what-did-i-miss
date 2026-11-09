# API & Data Contracts — Missed. (What Did I Miss?)

## 1. Overview

Missed. exposes two complementary contract surfaces:

1. **Shared Deterministic Engine (`@missed/engine`):** Pure TypeScript parsing and heuristic analysis functions shared across `frontend/`, `extension/`, and `server/`.
2. **Backend REST API (`server/`):** Hono + TypeScript HTTP service providing Supabase authentication, user-isolated conversation persistence, task tracking, and privacy settings.

- **Default Local Base URL:** `http://localhost:3001`
- **Content-Type:** `application/json; charset=utf-8`
- **Correlation Header:** Every response includes `X-Request-Id` (echoed from the incoming `X-Request-Id` header if valid, or server-generated UUID).

---

## 2. Authentication & Authorization Model

### Bearer Token Authentication
All protected routes require an `Authorization` header with a valid Supabase Auth JWT (or a session token issued by `/api/auth/signup` or `/api/auth/signin`):

```http
Authorization: Bearer <access_token>
```

### Zero-Trust Ownership Enforcement
- The server verifies every Bearer token via `authAdapter.verifyToken(accessToken)` in `requireAuth` middleware.
- **Client-provided ownership fields (`owner_id`, `user_id`, `ownerId`) are never trusted** and are rejected by `.strict()` Zod request schemas with `400 VALIDATION_ERROR`.
- Every database query scopes data to the verified `authUser.id` both in application query filters (`.eq('owner_id', authUser.id)`) and via PostgreSQL Row-Level Security (`auth.uid() = owner_id`).
- Attempting to read, update, or delete another user's conversation or task returns `404 NOT_FOUND` so resource existence is never leaked across tenants.

---

## 3. Standard Error Format

All error responses follow a consistent JSON envelope (`ErrorResponsePayload` in `server/src/lib/errors.ts`):

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "requestId": "c6f04072-7d9a-44eb-9127-2189b0e0470b",
  "details": [
    {
      "path": "email",
      "message": "Please provide a valid email address.",
      "code": "invalid_string"
    }
  ]
}
```

### Error Codes & HTTP Status Mapping

| Status | `error` Code | Description |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Malformed JSON body, invalid UUID parameter, or failed `.strict()` Zod schema validation |
| `400` | `AUTH_ERROR` | Authentication provider rejected sign-up request |
| `401` | `UNAUTHORIZED` | Missing, malformed, expired, or signed-out `Authorization: Bearer <token>` |
| `404` | `NOT_FOUND` | Route not found, or requested conversation/task does not exist for the authenticated user |
| `409` | `CONFLICT` | Account with the given email already exists |
| `413` | `PAYLOAD_TOO_LARGE` | Conversation import exceeds `MAX_FILE_SIZE_BYTES` (`10,485,760` bytes / 10 MiB) |
| `422` | `INVALID_CONVERSATION_FORMAT` | Uploaded TXT/JSON export is malformed or contains zero parseable messages |
| `429` | `RATE_LIMITED` | Too many requests within the active sliding window (`Retry-After` header included) |
| `500` | `INTERNAL_ERROR` | Unexpected server error or rolled-back atomic persistence failure |
| `500` | `ACCOUNT_DELETION_PARTIAL` | Error during multi-table account deletion cleanup |

---

## 4. Rate Limiting

Sliding-window rate limiting is enforced on sensitive endpoints and returns standard headers on every response:
- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Seconds until window reset
- `Retry-After`: Seconds to wait before retrying (included on `429 RATE_LIMITED`)

Default limits (configurable via environment variables):
- **Auth routes (`POST /api/auth/signup`, `POST /api/auth/signin`):** `10` requests per `60,000 ms` window
- **Conversation import (`POST /api/conversations`):** `20` requests per `60,000 ms` window

---

## 5. REST API Endpoints

### 5.1. Health Check

#### `GET /api/health`
- **Auth Required:** No
- **Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "storageMode": "supabase",
    "timestamp": "2026-10-13T00:00:00.000Z"
  }
  ```

---

### 5.2. Authentication & Account Lifecycle (`/api/auth`)

#### `POST /api/auth/signup`
Registers a new user account.
- **Auth Required:** No (Rate-limited)
- **Request Body (`SignUpRequestSchema`):**
  ```json
  {
    "email": "engineer@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (`201 Created` — `AuthSessionResponseSchema`):**
  ```json
  {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "engineer@example.com",
      "createdAt": "2026-10-13T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOi...",
    "expiresAt": 1791853200,
    "emailConfirmationRequired": false
  }
  ```

#### `POST /api/auth/signin`
Authenticates an existing user with email and password.
- **Auth Required:** No (Rate-limited)
- **Request Body (`SignInRequestSchema`):**
  ```json
  {
    "email": "engineer@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (`200 OK` — `AuthSessionResponseSchema`):** Same shape as `/api/auth/signup`.

#### `POST /api/auth/signout`
Revokes the caller's active session token.
- **Auth Required:** Yes (`Bearer <token>`)
- **Response (`200 OK` — `SignOutResponseSchema`):**
  ```json
  {
    "signedOut": true
  }
  ```

#### `GET /api/auth/me`
Returns the verified profile for the current bearer token.
- **Auth Required:** Yes (`Bearer <token>`)
- **Response (`200 OK` — `MeResponseSchema`):**
  ```json
  {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "engineer@example.com",
      "createdAt": "2026-10-13T00:00:00.000Z"
    }
  }
  ```

#### `DELETE /api/auth/account`
Permanently deletes all data owned by the authenticated user in strict dependency-safe order (`tasks` -> `findings` -> `messages` -> `conversations` -> `user_settings`), deletes the user's authentication record, and revokes the active session token.
- **Auth Required:** Yes (`Bearer <token>`)
- **Request Body (`DeleteAccountRequestSchema`):**
  ```json
  {
    "confirm": "DELETE_MY_ACCOUNT"
  }
  ```
- **Response (`200 OK` — `DeleteAccountResponseSchema`):**
  ```json
  {
    "deleted": true,
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

---

### 5.3. Conversations (`/api/conversations`)

#### `GET /api/conversations`
Lists conversations owned by the authenticated user in reverse chronological order.
- **Auth Required:** Yes (`Bearer <token>`)
- **Query Parameters (`PaginationQuerySchema`):**
  - `limit` (optional, integer `1..100`, default `20`)
  - `offset` (optional, integer `>= 0`, default `0`)
- **Response (`200 OK` — `ConversationListResponseSchema`):**
  ```json
  {
    "items": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "title": "Payment Gateway Cutover",
        "sourceFormat": "txt_bracketed",
        "messageCount": 14,
        "participantCount": 4,
        "participants": ["Maya", "Devon", "Elena", "Liam"],
        "topTopics": ["rollback", "gateway", "latency"],
        "summaryBullets": ["14 messages across 4 participants..."],
        "startTime": "2026-10-09 09:14",
        "endTime": "2026-10-09 09:42",
        "warning": null,
        "createdAt": "2026-10-13T00:00:00.000Z",
        "updatedAt": "2026-10-13T00:00:00.000Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 1
    }
  }
  ```

#### `POST /api/conversations`
Validates, parses, and deterministically analyzes a `.txt` or `.json` conversation export on the server using `@missed/engine`, then atomically persists the conversation, normalized messages, findings (`analyzer = "deterministic"`), and initial task records.
- **Auth Required:** Yes (`Bearer <token>`, Rate-limited)
- **Payload Size Limit:** `content` must not exceed `10,485,760` bytes (10 MiB). Oversized payloads are rejected with `413 PAYLOAD_TOO_LARGE`.
- **Request Body (`CreateConversationRequestSchema`):**
  ```json
  {
    "title": "Incident Review Thread",
    "fileName": "incident_review.txt",
    "format": "txt",
    "content": "[2026-10-09 09:15:00] Maya: CRITICAL: Payment gateway migration failed.\n[2026-10-09 09:16:30] Devon: @Elena please initiate rollback by 10 AM."
  }
  ```
- **Response (`201 Created` — `ConversationDetailResponseSchema`):**
  Returns `{ conversation, stats, messages, findings, tasks }`.

#### `GET /api/conversations/:id`
Loads a single conversation along with its ordered messages, prioritized findings, stats, and tasks.
- **Auth Required:** Yes (`Bearer <token>`)
- **URL Parameter:** `:id` (UUID)
- **Response (`200 OK` — `ConversationDetailResponseSchema`):**
  Returns `{ conversation, stats, messages, findings, tasks }`.
- **Error (`404 NOT_FOUND`):** Returned if the conversation does not exist or belongs to another user.

#### `DELETE /api/conversations/:id`
Deletes a conversation owned by the authenticated user (cascading to its messages, findings, and tasks).
- **Auth Required:** Yes (`Bearer <token>`)
- **URL Parameter:** `:id` (UUID)
- **Response (`200 OK` — `DeleteConversationResponseSchema`):**
  ```json
  {
    "deleted": true,
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
  ```

---

### 5.4. Tasks (`/api/tasks`)

#### `PATCH /api/tasks/:findingId`
Updates the completion status of a task associated with an owned finding. Automatically sets `completedAt` to the current ISO timestamp when `completed: true` and clears it to `null` when `completed: false`.
- **Auth Required:** Yes (`Bearer <token>`)
- **URL Parameter:** `:findingId` (UUID)
- **Request Body (`UpdateTaskRequestSchema`):**
  ```json
  {
    "completed": true
  }
  ```
- **Response (`200 OK` — `TaskResponseSchema`):**
  ```json
  {
    "task": {
      "id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "findingId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "conversationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "completed": true,
      "completedAt": "2026-10-13T00:05:00.000Z",
      "createdAt": "2026-10-13T00:00:00.000Z",
      "updatedAt": "2026-10-13T00:05:00.000Z"
    }
  }
  ```

---

### 5.5. User Privacy & Retention Settings (`/api/settings`)

#### `GET /api/settings`
Returns the authenticated user's privacy and retention settings (initializing defaults `aiEnabled: false, aiConsentAt: null, retentionDays: 30` if not yet set).
- **Auth Required:** Yes (`Bearer <token>`)
- **Response (`200 OK` — `UserSettingsResponseSchema`):**
  ```json
  {
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",
    "aiEnabled": false,
    "aiConsentAt": null,
    "retentionDays": 30,
    "createdAt": "2026-10-13T00:00:00.000Z",
    "updatedAt": "2026-10-13T00:00:00.000Z"
  }
  ```

#### `PUT /api/settings`
Updates the authenticated user's settings.
> **Privacy Note:** `aiEnabled` is a user preference toggle only. Per-conversation consent before transmitting conversation content to any external AI provider is enforced separately (Phase 5).
- **Auth Required:** Yes (`Bearer <token>`)
- **Request Body (`UpdateSettingsRequestSchema`):**
  ```json
  {
    "aiEnabled": true,
    "retentionDays": 90
  }
  ```
  Allowed `retentionDays` values: `7`, `30`, `90`, `365`.
- **Response (`200 OK` — `UserSettingsResponseSchema`):** Returns updated settings object.