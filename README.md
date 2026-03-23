# JobHunter AI

AI‑powered resume ingestion, job analysis, candidate/job matching, and outreach drafting built on Next.js, SQLite, and NVIDIA Kimi.

## Stack
- Next.js (App Router, React 19)
- better-sqlite3 (local persistence)
- LLM calls via NVIDIA `Kimi` (HTTP client in `lib/kimi.js`)
- SerpApi for job search imports

## Quick Start
```bash
git clone <your-repo-url>
cd agent-development
cp .env.example .env.local
npm install
npm run dev
```
App runs at `http://127.0.0.1:3000`.

## Environment Variables (`.env.local`)
- `NVIDIA_API_KEY` – required for resume parsing, job analysis, matching, and email generation.
- `SERPAPI_KEY`   – required for job search import.
- `DB_PATH`       – optional; path to the SQLite file. Defaults to `./jobhunter.db`. The app will create parent folders if needed.

## Scripts
- `npm run dev`   – start dev server (Turbopack).
- `npm run build` – production build.
- `npm run start` – serve the production build.

## Data Flow Overview
1) **Resume upload**: `/resume` → `POST /api/resume` → PDF parsed → LLM (`parseResume`) → saved to `resumes`.
2) **Job analysis**: `/jobs` → `POST /api/jobs` → LLM (`analyzeJob`) → saved to `jobs`.
3) **Matching**: `/match` → `POST /api/match` with `resume_id` + `job_id` → LLM (`matchResumeToJob`) → saved to `matches`.
4) **Outreach**: `/email` → `POST /api/email` with `match_id` + `tone` → LLM (`generateEmail`) → saved to `emails`.
5) **Search import**: `/search` → `POST /api/serpapi` (Google Jobs via SerpApi) → optional import to `/api/jobs`.

## Notes / Operational Considerations
- The database file is local; use `DB_PATH` to point to a writable location in your deployment environment.
- Resume uploads are limited by PDF parseability; ensure PDFs contain text (not pure scans).
- API keys are required for end‑to‑end functionality; without them, LLM-backed routes will fail.

## Troubleshooting
- If you see `pdf-parse` type errors, ensure `NVIDIA_API_KEY` is set and the uploaded file is a real PDF with text.
- Port conflicts on `3000`: stop other Next.js instances or run `npm run dev -- --port 3001`.
