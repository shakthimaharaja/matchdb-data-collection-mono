# MatchDB Data Collection

> MERN monorepo for collecting candidate profiles and job openings that will later seed the main MatchDB Jobs database.

---

## Overview

This application provides a standalone data-collection portal with **two role-based logins**.
Each role has **three ways** to enter data: copy / paste structured text, fill a manual form, or upload an Excel spreadsheet.

| Role                   | Dashboard                                  | Data Stored                |
| ---------------------- | ------------------------------------------ | -------------------------- |
| **Candidate Uploader** | Candidate entry (paste / manual / Excel)   | `CandidateData` collection |
| **Job Uploader**       | Job posting entry (paste / manual / Excel) | `JobData` collection       |

No signup — accounts are pre-seeded.

---

## Tech Stack

| Layer        | Technology                                                          |
| ------------ | ------------------------------------------------------------------- |
| **Frontend** | React 18 · Vite · TypeScript · React Router 6 · Axios               |
| **Backend**  | Express 4 · TypeScript · Mongoose 8 · JWT · Multer · SheetJS (xlsx) |
| **Database** | MongoDB (`matchdb_data_collection`)                                 |
| **Monorepo** | npm workspaces · concurrently                                       |

---

## Project Structure

```
matchdb-data-collection-mono/
├── package.json            # Root — workspaces + dev/seed scripts
├── server/                 # Express API (port 5001)
│   ├── src/
│   │   ├── config/         # env, mongoose
│   │   ├── controllers/    # auth, candidates, jobs
│   │   ├── middleware/     # auth (JWT), error
│   │   ├── models/         # User, CandidateData, JobData
│   │   ├── routes/         # auth, candidates, jobs
│   │   ├── app.ts          # Express setup
│   │   └── index.ts        # Entry point
│   ├── seed.ts             # Mock data seeder
│   └── .env                # Environment variables
└── client/                 # React SPA (port 5173)
    ├── src/
    │   ├── components/     # Navbar, PasteTab, CandidateForm, JobForm, ExcelUpload, DataTable
    │   ├── pages/          # LoginPage, Dashboard
    │   ├── context/        # AuthContext (JWT + localStorage)
    │   ├── services/       # Axios API client
    │   ├── types/          # TypeScript interfaces
    │   ├── App.tsx          # Router + protected routes
    │   ├── main.tsx         # Entry point
    │   └── index.css        # Design system
    ├── vite.config.ts       # Vite + API proxy
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

---

## API Endpoints

### Auth

| Method | Path               | Description              |
| ------ | ------------------ | ------------------------ |
| `POST` | `/api/auth/login`  | Login → JWT token        |
| `GET`  | `/api/auth/verify` | Verify token → user info |

### Candidates (requires `candidate_uploader` role)

| Method   | Path                     | Description                   |
| -------- | ------------------------ | ----------------------------- |
| `GET`    | `/api/candidates`        | List all candidates (by user) |
| `GET`    | `/api/candidates/stats`  | Get stats (total + by source) |
| `POST`   | `/api/candidates`        | Create single candidate       |
| `POST`   | `/api/candidates/bulk`   | Bulk create from JSON array   |
| `POST`   | `/api/candidates/upload` | Upload Excel/CSV file         |
| `DELETE` | `/api/candidates/:id`    | Delete a candidate            |

### Jobs (requires `job_uploader` role)

| Method   | Path               | Description                   |
| -------- | ------------------ | ----------------------------- |
| `GET`    | `/api/jobs`        | List all jobs (by user)       |
| `GET`    | `/api/jobs/stats`  | Get stats (total + by source) |
| `POST`   | `/api/jobs`        | Create single job             |
| `POST`   | `/api/jobs/bulk`   | Bulk create from JSON array   |
| `POST`   | `/api/jobs/upload` | Upload Excel/CSV file         |
| `DELETE` | `/api/jobs/:id`    | Delete a job                  |

---

## Seed Data

The `npm run seed` command populates:

- **2 users** — one per role
- **7 candidate records** — Priya Sharma, Marcus Johnson, Emily Chen, David Kim, Aisha Rahman, Carlos Rivera, Yuki Tanaka (varied sources: manual, paste, Excel)
- **8 job records** — Senior React Dev, Cloud Architect, Data Analyst, Mobile Dev, Backend Engineer, ML Engineer, DevOps/SRE, Full Stack (varied types, subtypes, locations)

---

## UI Features

- **Login Page** — Gradient background, one-click demo credential fills
- **Dashboard** — Stats cards (total / paste / manual / Excel), three-tab input, scrollable data table
- **Paste Tab** — Monospace textarea with template; parses `Key: Value` format, previews in editable form
- **Manual Tab** — Sectioned form with validation, skill tags, responsive grid
- **Excel Tab** — Drag & drop zone, file picker, column header reference
- **Data Table** — Source badges, delete action, responsive overflow
- **Toast Notifications** — Success / error feedback
- **Responsive** — Mobile-friendly at 768px / 480px breakpoints

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
