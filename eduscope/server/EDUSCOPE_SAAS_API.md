# EDUSCOPE SaaS — Backend Extension Reference

## What changed / what's new

| File | Action |
|------|--------|
| `db/index.js` | Added `universities`, `departments` tables; additive column migrations for `users` and `sessions` |
| `controllers/authController.js` | Signup now accepts `universityId` + `departmentId`; login response includes university/dept info |
| `controllers/universityController.js` | **NEW** — public university + dept endpoints |
| `controllers/analyticsController.js` | **NEW** — all advanced analytics (poll, faculty, university, leaderboard, weak topics, student profiles, disqualified) |
| `controllers/sessionController.js` | `createSession` now stamps `university_id` + `department_id` from faculty profile |
| `routes/universities.js` | **NEW** |
| `routes/analytics.js` | **NEW** |
| `index.js` | Two new route mounts added |

All existing controllers/routes are **untouched**.

---

## Data Models

### `universities`
| col | type | notes |
|-----|------|-------|
| id | TEXT PK | uuid |
| name | TEXT UNIQUE | e.g. "Lovely Professional University" |
| short_name | TEXT | e.g. "LPU" |
| city | TEXT | |
| active | INTEGER | 1 = shown publicly |
| created_at | INTEGER | ms epoch |

### `departments`
| col | type | notes |
|-----|------|-------|
| id | TEXT PK | uuid |
| university_id | TEXT FK → universities | |
| name | TEXT | UNIQUE per university |
| created_at | INTEGER | |

### `users` (new columns)
| col | type | notes |
|-----|------|-------|
| university_id | TEXT FK → universities | nullable (migration-safe) |
| department_id | TEXT FK → departments | nullable (migration-safe) |

### `sessions` (new columns)
| col | type | notes |
|-----|------|-------|
| university_id | TEXT FK → universities | auto-stamped from faculty |
| department_id | TEXT FK → departments | auto-stamped from faculty |

---

## API Reference

### University System (public — no auth needed)

```
GET  /api/universities
```
Returns all active universities with `dept_count` and `faculty_count`.

```
GET  /api/universities/:universityId
```
Returns university detail + departments list + aggregate counts.

```
GET  /api/universities/:universityId/departments
```
Returns departments array — use this to populate the signup dropdown after university selection.

---

### Auth (extended)

```
POST /api/auth/register
```
Body:
```json
{
  "name": "Dr. Singh",
  "email": "singh@lpu.edu",
  "password": "secret",
  "role": "faculty",
  "universityId": "<uuid>",
  "departmentId": "<uuid>"
}
```
Faculty **must** include `universityId` + `departmentId`. Students may omit.

Response includes:
```json
{
  "token": "...",
  "user": {
    "id": "...", "name": "...", "email": "...", "role": "faculty",
    "university": { "name": "LPU", "short_name": "LPU" },
    "department": { "name": "Computer Science & Engineering" }
  }
}
```

```
POST /api/auth/login
```
Same as before. Response now includes `university` + `department` objects.

---

### Analytics — Faculty

```
GET  /api/analytics/faculty/summary
```
Auth: faculty  
Returns: `total_sessions`, `total_students`, `total_polls`, `weak_topics[]`, `recent_sessions[]`

```
GET  /api/analytics/faculty/weak-topics
```
Auth: faculty  
Returns topics sorted by `avg_correct` ascending (worst first). Each entry: `{ tag, polls, avg_correct }`.

```
GET  /api/analytics/faculty/disqualified?sessionId=<optional>
```
Auth: faculty  
Returns all disqualified participants across faculty's sessions, optionally filtered to one session.

```
GET  /api/analytics/faculty/students/:studentId
```
Auth: faculty  
Returns full student profile: stats, `weak_topics[]`, `sessions[]`, `history[]` (last 50 responses).

```
GET  /api/analytics/sessions/:sessionId/polls
```
Auth: faculty  
Per-poll breakdown for a session:
- `distribution[]` — vote count per option
- `timeline[]` — response velocity over time `{ t: seconds_since_start, count }`
- `accuracy` — % correct (null if no correct_index)
- `struggled` — true if accuracy < 60%

---

### Analytics — University

```
GET  /api/analytics/university/:universityId
```
Auth: any authenticated user belonging to that university  
Returns university overview + per-department stats + weak topics per dept.

---

### Analytics — Leaderboard

```
GET  /api/analytics/leaderboard?universityId=<>&departmentId=<>
```
Auth: any  
Query params optional — omit for global, add `universityId` for university-scoped, add `departmentId` for dept-scoped.

Scoring formula: `score = (answered / totalPolls * 50) + (accuracy * 0.5)`  
Returns top 20 + current user's row if outside top 20.

Each entry: `{ rank, id, name, answered, accuracy, score, department }`.

---

## Faculty Signup Flow (recommended UI)

```
1. GET /api/universities              → populate university dropdown
2. user selects university
3. GET /api/universities/:id/departments → populate department dropdown
4. POST /api/auth/register with universityId + departmentId
```

---

## Migration Notes

The DB migration is **fully additive** — existing `pollcast.db` files are safe.  
On first boot the new code:
1. Creates `universities` and `departments` tables if absent
2. `ALTER TABLE users ADD COLUMN university_id` (skipped if column exists)
3. `ALTER TABLE users ADD COLUMN department_id` (same)
4. `ALTER TABLE sessions ADD COLUMN university_id` (same)
5. `ALTER TABLE sessions ADD COLUMN department_id` (same)
6. Seeds 3 universities + 8 departments if `universities` table is empty

Existing users will have `university_id = NULL` — no breakage, all existing endpoints unchanged.

---

## Seeded Universities (dev)

| Name | Short | City |
|------|-------|------|
| Lovely Professional University | LPU | Phagwara |
| Punjab Technical University | PTU | Kapurthala |
| Chandigarh University | CU | Mohali |

Demo credentials unchanged: `faculty@pollcast.edu` / `password123`
