# EDUSCOPE v3 — Multi-University Analytics Platform

## Quick Start

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Run the backend
```bash
cd server
npm run dev       # with nodemon (auto-restart)
# or
npm start         # plain node
```
Server starts at **http://localhost:4000**  
DB auto-creates + seeds on first boot.

### 3. Run the frontend (separate terminal)
```bash
cd client
npm run dev
```
Client starts at **http://localhost:5173**

---

## Demo credentials
| Role | Email | Password |
|------|-------|----------|
| Faculty | faculty@pollcast.edu | password123 |
| Student | student@pollcast.edu | password123 |

---

## New in v3 (SaaS extension)

### New API endpoints
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/universities` | Public | List all universities |
| `GET /api/universities/:id` | Public | University detail |
| `GET /api/universities/:id/departments` | Public | Departments for signup dropdown |
| `GET /api/analytics/faculty/summary` | Faculty | Total sessions, students, weak topics |
| `GET /api/analytics/faculty/weak-topics` | Faculty | Topics sorted worst-first |
| `GET /api/analytics/faculty/disqualified` | Faculty | All disqualified students |
| `GET /api/analytics/faculty/students/:id` | Faculty | Full student profile |
| `GET /api/analytics/sessions/:id/polls` | Faculty | Per-poll distribution + timeline |
| `GET /api/analytics/university/:id` | Faculty | University-wide cross-dept stats |
| `GET /api/analytics/leaderboard?universityId=` | Any | Scoped leaderboard |

### Faculty signup flow
1. `GET /api/universities` → show university dropdown
2. User selects university
3. `GET /api/universities/:id/departments` → show department dropdown
4. `POST /api/auth/register` with `universityId` + `departmentId`

### Migration
Existing databases are safe — all schema changes are additive (`ALTER TABLE ADD COLUMN`).

See `server/EDUSCOPE_SAAS_API.md` for full API docs.
