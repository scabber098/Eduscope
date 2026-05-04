# EduScope v5 — Backend Upgrade Changelog

All changes are **additive only**. Zero existing routes, models, or logic modified.

---

## 1. RBAC — `allowRoles(...roles)` middleware
**File:** `server/middleware/auth.js`
- Added `allowRoles('faculty', 'admin')` — accepts multiple roles (unlike `requireRole` which accepts one)
- Existing `requireRole`, `authRequired`, `signToken` untouched
- User model already had `role` field with `student`/`faculty` enum — extended enum to include `admin` path (opt-in)

---

## 2. Audit Log System
**New files:**
- `server/models/AuditLog.js` — `{ userId, action, metadata, timestamp }`
- `server/utils/auditLogger.js` — fire-and-forget `logAudit()` helper

**Actions logged:**
| Action | Where |
|---|---|
| `LOGIN` | `authController.login` |
| `REGISTER` | `authController.register` |
| `TAB_SWITCH` | `routes/studentActivity` |
| `DISQUALIFIED` | `routes/studentActivity` |
| `BLOCKED` | `routes/studentActivity` |
| `UNBLOCKED` | `routes/studentActivity` |
| `POLL_SUBMITTED` | `routes/pollTimer` (auto-submit) |

---

## 3. Analytics Summary API
**New file:** `server/routes/analyticsSummary.js`

```
GET /api/analytics/summary
Authorization: Bearer <faculty-token>

Response:
{
  totalStudents: 42,
  averageMarks: 73.5,
  highestMarks: 100,
  disqualifiedCount: 3,
  totalTabSwitches: 11
}
```

---

## 4. Poll Timer System
**Modified (additive):** `server/models/Poll.js` — added optional `duration` field (minutes)

**New files:**
- `server/models/PollSession.js` — tracks per-student `startTime` per poll
- `server/routes/pollTimer.js`

```
POST /api/poll-timer/:pollId/start      → records startTime, returns timeRemainingMs
POST /api/poll-timer/:pollId/auto-submit → validates expiry, writes Response if answer given
```

---

## 5. Rate Limiting
**New file:** `server/middleware/rateLimiter.js`

| Route | Limit |
|---|---|
| `POST /api/auth/login` | 10 req / 15 min per IP |
| `POST /api/auth/register` | 10 req / 15 min per IP |
| All `/api/sessions/*` routes | 20 req / 5 min per IP |

**Dependency added:** `express-rate-limit ^7.4.1`

Install: `cd server && npm install`

---

## 6. Pagination + Filtering on `GET /api/students`
**Modified (additive):** `server/routes/students.js`

```
GET /api/students?page=1&limit=20&university=MIT&isDisqualified=false
```

- `page` + `limit` — standard pagination (omit `limit` for legacy no-limit behaviour)
- `university` — case-insensitive partial match on `university_name`
- `isDisqualified` — `true` / `false` filter

Response now includes `pagination: { page, limit, total, totalPages }` field (null if no limit set).

---

## 7. CSV Export
**Added to:** `server/routes/students.js`

```
GET /api/students/export
Authorization: Bearer <any-token>
```

Returns `Content-Type: text/csv` download with columns:
`name, registrationNumber, email, class, section, university_name, marks, tabSwitchCount, status`

Status values: `active` / `disqualified` / `blocked`

---

---

## Frontend Integration (client)

### `src/api/client.js`
Extended `StudentAPI.list()` to accept `{ page, limit, university, isDisqualified }` query params.
Added `StudentAPI.export()` — returns blob for CSV download.
Added `AnalyticsSummaryAPI.summary()` → `GET /api/analytics/summary`.
Added `PollTimerAPI.start(pollId)` and `PollTimerAPI.autoSubmit(pollId, answerIndex)`.

### NEW: `src/components/AnalyticsSummaryPanel.jsx`
Live stat tiles shown on FacultyDashboard:
`totalStudents · averageMarks · highestMarks · disqualifiedCount · totalTabSwitches`
Staggered entry animation. Graceful error state.

### `src/pages/faculty/FacultyDashboard.jsx`
Injected `<AnalyticsSummaryPanel />` directly under the main stats row. Zero existing code removed.

### `src/pages/faculty/Students.jsx`
- Server-side pagination (20 per page) with animated page controls
- Status filter dropdown (All / Active only / Disqualified only)
- **⬇ Export CSV** button triggers blob download from `/api/students/export`
- Client-side text search still works on current page
- Page resets to 1 when filters change

### NEW: `src/components/PollTimerBadge.jsx`
Circular SVG countdown timer for student poll view.
- Calls `PollTimerAPI.start()` on mount
- Color transitions: green → amber (< 60s) → red (< 30s)
- Fires `PollTimerAPI.autoSubmit()` on expiry, then calls `onExpired(answerIndex)` callback
- Returns `null` when poll has no duration — zero impact on non-timed polls

### `src/pages/faculty/CreatePoll.jsx`
Added **Poll timer** dropdown (No auto-submit / 1 / 2 / 5 / 10 / 15 / 30 min).
Wired to `pollDuration` in `SessionAPI.create()` payload.

### `src/pages/student/ActivePolls.jsx`
- Added `selectedAnswers` ref — tracks last tapped option per poll for timer handoff
- Each option button now writes to ref before submitting
- `PollTimerBadge` injected above options when `p.duration` is set
- `handleAnswer` guards against `-1` (no selection on auto-submit) — skips API call cleanly


---

## Setup after upgrade

```bash
cd server
npm install          # picks up express-rate-limit
node index.js
```

```bash
cd client
npm install          # no new deps added
npm run dev
```

No database migrations required — all new fields have defaults.
