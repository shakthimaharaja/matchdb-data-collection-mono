# MatchDB Data Collection

> MERN monorepo for collecting candidate profiles and job openings that will later seed the main MatchDB Jobs database.

---

## Overview

This application provides a standalone data-collection portal with **three role-based logins**:

| Role                   | Dashboard                                  | Data Stored                |
| ---------------------- | ------------------------------------------ | -------------------------- |
| **Candidate Uploader** | Candidate entry (paste / manual / Excel)   | `CandidateData` collection |
| **Job Uploader**       | Job posting entry (paste / manual / Excel) | `JobData` collection       |
| **Admin**              | Platform-wide stats & billing dashboard    | Read-only aggregate view   |

Each uploader role has **three ways** to enter data: copy / paste structured text, fill a manual form, or upload an Excel spreadsheet. An optional **AI-powered text parser** (OpenAI) can extract structured fields from free-form job descriptions.

No signup — accounts are pre-seeded.

---

## Tech Stack

| Layer        | Technology                                                          |
| ------------ | ------------------------------------------------------------------- |
| **Frontend** | React 18 · Vite · TypeScript · React Router 6 · Axios              |
| **Backend**  | Express 4 · TypeScript · Mongoose 8 · JWT · Multer · SheetJS (xlsx) |
| **Database** | MongoDB (`matchdb_data_collection`)                                 |
| **AI Parse** | OpenAI API (optional)                                               |
| **Monorepo** | npm workspaces · concurrently                                       |

---

## Project Structure

```
matchdb-data-collection-mono/
├── package.json              # Root — workspaces + dev/seed scripts
├── server/                   # Express API (port 5001)
│   ├── src/
│   │   ├── config/           # env, mongoose
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts        # Login, verify
│   │   │   ├── candidates.controller.ts  # CRUD, bulk, Excel upload, stats
│   │   │   ├── jobs.controller.ts        # CRUD, bulk, Excel upload, stats
│   │   │   ├── admin.controller.ts       # Admin: list users, aggregate stats
│   │   │   ├── ai-parse.controller.ts    # OpenAI-powered text → structured job
│   │   │   └── template.controller.ts    # Excel template download
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts         # JWT guard + requireRole (multi-role)
│   │   │   └── error.middleware.ts        # Global error handler
│   │   ├── models/
│   │   │   ├── User.model.ts             # Roles: candidate_uploader, job_uploader, admin
│   │   │   ├── CandidateData.model.ts    # + is_duplicate flag
│   │   │   └── JobData.model.ts          # + is_duplicate flag
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── candidates.routes.ts
│   │   │   ├── jobs.routes.ts
│   │   │   ├── admin.routes.ts           # Admin-only (role-gated)
│   │   │   ├── ai-parse.routes.ts
│   │   │   └── template.routes.ts
│   │   ├── app.ts            # Express setup + route mounting
│   │   └── index.ts          # Entry point
│   ├── seed.ts               # Mock data seeder (users + 7 candidates + 8 jobs)
│   └── .env                  # Environment variables
└── client/                   # React SPA (port 5173)
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx         # Role badge, logout
    │   │   ├── PasteTab.tsx       # Smart text parser (100+ tech keywords)
    │   │   ├── CandidateForm.tsx  # Manual candidate entry form
    │   │   ├── JobForm.tsx        # Manual job entry form
    │   │   ├── ExcelUpload.tsx    # Drag & drop + template download
    │   │   └── DataTable.tsx      # Source badges, duplicate badge, delete
    │   ├── pages/
    │   │   ├── LoginPage.tsx      # Gradient login with demo credential fills
    │   │   ├── Dashboard.tsx      # Stats + 3-tab input + data table
    │   │   └── AdminDashboard.tsx # Platform totals + per-user breakdowns
    │   ├── context/       # AuthContext (JWT + localStorage)
    │   ├── services/      # Axios API client
    │   ├── types/         # TypeScript interfaces
    │   ├── App.tsx        # Router + role-based routing (admin → AdminDashboard)
    │   ├── main.tsx       # Entry point
    │   └── index.css      # Design system (1400+ lines)
    ├── vite.config.ts     # Vite + API proxy
    └── index.html
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running on `localhost:27017` (Docker or local)

### Install & Run

```bash
# 1. Install all workspace dependencies
npm install

# 2. Seed the database (creates users + mock data)
npm run seed

# 3. Start dev servers (API + UI together)
npm run dev
```

- **API** → `http://localhost:5001`
- **UI** → `http://localhost:5173`

### Login Credentials

| Role               | Email                            | Password   |
| ------------------ | -------------------------------- | ---------- |
| Candidate Uploader | `candidate_uploader@matchdb.com` | `Upload1!` |
| Job Uploader       | `job_uploader@matchdb.com`       | `Upload1!` |
| Admin              | `admin@matchdb.com`              | `Admin1!`  |

---

## API Endpoints

### Auth

| Method | Path               | Description              |
| ------ | ------------------ | ------------------------ |
| `POST` | `/api/auth/login`  | Login → JWT token        |
| `GET`  | `/api/auth/verify` | Verify token → user info |

### Candidates (requires `candidate_uploader` role)

| Method   | Path                     | Description                                 |
| -------- | ------------------------ | ------------------------------------------- |
| `GET`    | `/api/candidates`        | List all candidates (by user)               |
| `GET`    | `/api/candidates/stats`  | Stats: total, duplicates, bySource, byMonth |
| `POST`   | `/api/candidates`        | Create single candidate (flags dups)        |
| `POST`   | `/api/candidates/bulk`   | Bulk create from JSON array (flags dups)    |
| `POST`   | `/api/candidates/upload` | Upload Excel/CSV file (flags dups)          |
| `DELETE` | `/api/candidates/:id`    | Delete a candidate                          |

### Jobs (requires `job_uploader` role)

| Method   | Path               | Description                                 |
| -------- | ------------------ | ------------------------------------------- |
| `GET`    | `/api/jobs`        | List all jobs (by user)                     |
| `GET`    | `/api/jobs/stats`  | Stats: total, duplicates, bySource, byMonth |
| `POST`   | `/api/jobs`        | Create single job (flags dups)              |
| `POST`   | `/api/jobs/bulk`   | Bulk create from JSON array (flags dups)    |
| `POST`   | `/api/jobs/upload` | Upload Excel/CSV file (flags dups)          |
| `DELETE` | `/api/jobs/:id`    | Delete a job                                |

### Admin (requires `admin` role)

| Method | Path               | Description                                      |
| ------ | ------------------ | ------------------------------------------------ |
| `GET`  | `/api/admin/users` | List all non-admin users                         |
| `GET`  | `/api/admin/stats` | Per-user aggregated stats + platform-wide totals |

### Templates (requires auth)

| Method | Path                   | Description                                 |
| ------ | ---------------------- | ------------------------------------------- |
| `GET`  | `/api/templates/:type` | Download Excel template (`job`/`candidate`) |

### AI Parse (requires auth)

| Method | Path             | Description                               |
| ------ | ---------------- | ----------------------------------------- |
| `POST` | `/api/ai-parse/` | OpenAI-powered free-text → structured job |

---

## Key Features

### Duplicate Detection

All creation endpoints (manual, bulk paste, Excel upload) detect duplicates and **flag** them with `is_duplicate: true` instead of rejecting. This allows tracking how many duplicate entries a user submits for billing purposes.

- **Jobs:** Matched by title + company + location (case-insensitive) per user
- **Candidates:** Matched by name + email per user
- The DataTable shows a `⚠️ Dup` badge on flagged rows

### Smart Text Parser

The paste tab includes a built-in parser that extracts structured fields from free-form job/candidate text:

- 100+ technology keywords auto-detected as skills
- Emoji stripping, shorthand detection (`ft` → `full_time`, `c2c` → `c2c`)
- Handles multiple real-world recruiter email templates
- Optional OpenAI-powered AI parse for complex descriptions

### Excel Template Download

Each portal provides a downloadable `.xlsx` template with:

- Column headers (required fields marked with `*`)
- Sample data row
- Instructions sheet with allowed values
- Templates auto-normalize headers (`Title *` → `Title`) on re-upload

### Stats & Billing

- **5 stat cards:** Total, Paste, Manual, Excel, Duplicates
- **Monthly Activity grid:** Per-month record count + duplicate count
- Admin dashboard aggregates across all users with billable vs duplicate breakdown

### Admin Dashboard

Admin login shows a dedicated dashboard with:

- Platform-wide totals (users, records, unique, duplicates)
- Per-user cards with source breakdown (📋 paste / ✏️ manual / 📁 Excel)
- Expandable monthly billing table (records, duplicates, billable)

---

## Seed Data

The `npm run seed` command populates:

- **3 users** — one per role (candidate_uploader, job_uploader, admin)
- **7 candidate records** — Priya Sharma, Marcus Johnson, Emily Chen, David Kim, Aisha Rahman, Carlos Rivera, Yuki Tanaka (varied sources: manual, paste, Excel)
- **8 job records** — Senior React Dev, Cloud Architect, Data Analyst, Mobile Dev, Backend Engineer, ML Engineer, DevOps/SRE, Full Stack (varied types, subtypes, locations)

---

## Environment Variables

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=matchdb_data_collection
JWT_SECRET=your-jwt-secret
PORT=5001
CORS_ORIGINS=http://localhost:5173

# Optional — for AI parse feature
OPENAI_API_KEY=
```

---

## Scripts

| Script               | Description                   |
| -------------------- | ----------------------------- |
| `npm run dev`        | Start API + UI (concurrently) |
| `npm run dev:server` | Start API only                |
| `npm run dev:client` | Start UI only                 |
| `npm run seed`       | Seed MongoDB with mock data   |
| `npm run build`      | Production build (client)     |

---

## License

MIT
