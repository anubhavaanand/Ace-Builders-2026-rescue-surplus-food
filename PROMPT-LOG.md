# Prompt Log — Rescue the Surplus
**Maintained by:** Anubhav Anand  
**Purpose:** Required submission item — Codebenders usage details, key prompts, and iterations  
**Format:** Log of all major Nexen interactions, iterations, and results during development  

> ⚠️ **Evaluation Reference:** Scored under *Build Quality and Use of Codebenders (15%)*. This document records the live prompt engineering and agent orchestration across the build.

---

## Master Architecture Prompts (Consolidated)

### Part A: System Architecture & Backend Scaffold
```markdown
You are building a production-quality web application for the ACE Builders Hackathon 2026.

## Project: Rescue the Surplus
A mobile-first Progressive Web App (PWA) that connects surplus food donors with nearby receivers inside a short spoilage window, coordinates volunteer pickup, and proves social impact through a transparent dashboard.

## STACK — Do not deviate
- Frontend: React 18 + Vite + TailwindCSS
- PWA: vite-plugin-pwa (manifest + service worker + offline fallback)
- Backend: Node.js + Express.js (REST API)
- Database: SQLite with better-sqlite3 (file-based, zero config)
- No ORM — use raw SQL with better-sqlite3's synchronous API
- Package manager: npm
```

### Part B: Frontend Client & Five Screens Specification
```markdown
You are building the complete mobile-first Progressive Web App (PWA) frontend for "Rescue the Surplus".

Target directory: Create all files directly inside `./client` (do NOT touch `./server` or root).

## 1. TECH STACK & CONFIG
- React 18 + Vite + TailwindCSS
- vite-plugin-pwa (configured in vite.config.js with standalone mode, #16a34a theme, and workbox fallback to /offline.html)
- Node/npm

## 2. 5 SCREENS SPECIFICATION
- Screen 1: PostSurplus.jsx (donor flow with 60s timer freezing on submit)
- Screen 2: MatchClaim.jsx (ranked listings with all 4 score components visible + Claim button)
- Screen 3: StatusBoard.jsx (live board: posted → claimed → collected → delivered)
- Screen 4: Impact.jsx (metrics with click-to-reveal formulas + funding split showing Receiver: ₹0)
- Screen 5: ListingDetail.jsx (handling, allergens, bold expiry line, volunteer instructions, and food safety disclaimer)
```

---

## Chronological Log Entries

---

### Entry 001 — Initial System Scaffold & Working Directory Alignment
- **Timestamp:** 2026-11-22 17:50 IST  
- **Agent Roles Used:** `explore`, `editor`
- **Prompt given to Nexen:**
  Architecture scaffold prompt containing repository layout, SQLite schema, seed data, API routes, scoring algorithm, and screen definitions.
- **What Nexen generated:**
  - Root `package.json` with concurrent dev/build scripts
  - Root `.gitignore` and `.env.example`
  - Directory scaffolding for `server/` (`db/`, `middleware/`, `routes/`, `services/`)
- **Iterations needed:**
  - Nexen initially created a nested `rescue-surplus-food/rescue-surplus-food/` subfolder based on the root ASCII tree diagram.
  - Clarified working directory: current directory (`.`) is already the repo root. Nexen ran cleanup to flatten the directory structure.
- **Result:** Partial — root configuration files successfully generated; folder structure aligned.

---

### Entry 002 — Granular File Generation & Subagent Permission Handling
- **Timestamp:** 2026-11-22 17:57 IST  
- **Agent Roles Used:** `editor`, `tester`
- **Prompt given to Nexen:**
  *"The folders already exist on disk. Proceed with writing the server files one by one, starting with server/package.json, verifying each on disk before moving to the next."*
- **What Nexen generated:**
  - `server/package.json` with dependencies (`better-sqlite3`, `express`, `cors`).
- **Iterations needed:**
  - Nexen's editor subagent encountered tool call write limits when attempting to output all 11 backend files in a single pass.
  - Steered Nexen to use single-file sequential generation to prevent subagent timeouts.
- **Result:** Working — `server/package.json` verified on disk and passed JSON linting.

---

### Entry 003 — Full Server Implementation & Smoke Test Execution
- **Timestamp:** 2026-11-22 18:10 IST  
- **Agent Roles Used:** `editor`, `tester`
- **Prompt given to Nexen:**
  *"Build the server first: implement schema.sql, connection.js, seed.js, services, and the Express routes inside server/ from 02-TECH-ARCHITECTURE.md."*
- **What Nexen generated:**
  - `server/db/schema.sql` (enforcing `CHECK (receiver_charge = 0)` on `payments`)
  - `server/db/connection.js` (better-sqlite3 singleton)
  - `server/db/seed.js` (synthetic dataset with donors, receivers, volunteers, listings)
  - `server/middleware/validate.js` (input sanitization and 400 error handlers)
  - `server/services/matching.js` (4-part scoring: distance, quantity fit, time-to-spoil, need)
  - `server/services/expiry.js` (lazy listing expiration service)
  - `server/services/impact.js` (transparent metrics and formula calculation)
  - `server/routes/listings.js` & `server/routes/impact.js`
  - `server/index.js` (Express entry point on port 3001)
- **Iterations needed:**
  - Seed spec conflict: Handled a prompt on listing `notes` field by selecting "Drop notes" to preserve schema integrity without migration churn.
- **Result:** Verified & Working — Port 3001 responded to live curl checks:
  - `GET /api/listings/available` returned 200 with 4 score components.
  - `GET /api/impact` returned 200 with full formula metadata and funding split.
  - `GET /api/listings/:id` returned 200 with safety disclaimer and allergen list.

---

### Entry 004 — Frontend Client Scaffold & Core Architecture
- **Timestamp:** 2026-11-22 18:24 IST  
- **Agent Roles Used:** `editor`
- **Prompt given to Nexen:**
  *"Proceed to building the complete frontend inside ./client: scaffold Vite + React 18 + TailwindCSS + vite-plugin-pwa, set up RoleContext and RoleSwitch dropdown, build all five screens, and wire api/client.js."*
- **What Nexen generated:**
  - `client/package.json`, `client/vite.config.js`, `client/tailwind.config.js`, `client/postcss.config.js`
  - `client/public/manifest.json`, `client/public/offline.html`
  - All 5 full screen components in `client/src/pages/`
  - Reusable components (`Timer`, `ScoreCard`, `StatusBadge`, `MetricBox`, `Disclaimer`, `RoleSwitch`)
  - State management (`RoleContext.jsx`, `useRole.js`, `useTimer.js`)
  - API client wrapper (`api/client.js`)
- **Iterations needed:**
  - Explicitly corrected relative path targeting to `./client/` rather than `rescue-surplus-food/client/`.
- **Result:** Working — All 25 React and PWA source files created.

---

### Entry 005 — PWA Shell Completion, Icon Asset Generation & Production Build
- **Timestamp:** 2026-11-22 18:38 IST  
- **Agent Roles Used:** `editor`, `tester`
- **Prompt given to Nexen:**
  *"Finish client/src/App.jsx and build the client: wrap in RoleProvider, render header RoleSwitch, render bottom navigation tabs (≥48px), generate icons, and run npm install and npm run build in client/."*
- **What Nexen generated:**
  - `client/src/App.jsx` with header, bottom navigation bar, and tab routing
  - `client/scripts/make-icons.mjs` (PNG generator using pure Node zlib/fs)
  - `client/public/icon-192.png` and `client/public/icon-512.png`
  - Production build in `client/dist/`
- **Result:** Fully Verified — `npm run build` exited with code 0 (48 modules transformed, 9 PWA precache entries).

---

### Entry 006 — Batch C API Contract Alignment & Verification
- **Timestamp:** 2026-11-22 21:05 IST  
- **Agent Roles Used:** `explore`, `editor`, `tester`
- **Prompt given to Nexen:**
  *"Read-only check of 04-API-CONTRACT.md against code on disk. Fix every FAIL from the table one at a time: allergens validation, unknown donor error code, transition body, and impact formula keys."*
- **Actions Executed:**
  - `server/middleware/validate.js`: Enforced 400 status for non-array `allergens`; updated unknown `donor_id` to return 404 `"donor not found"`.
  - `server/routes/listings.js`: Updated transition response to include `listing_id`, `status`, timestamp (`collected_at`/`delivered_at`), and `actor_id`; joined volunteers table to return `claimed_by_volunteer_name`.
  - `server/services/impact.js`: Renamed formula keys to `delivered_listing_count` and `co2e_factor`; updated `cost_per_meal_saved` to explicitly scope funding sum to delivered listings.
- **Result:** Contract audit improved from 7 FAILs to 0 blocking bugs. All server files passed `node --check`.

---

### Entry 007 — Batch 1 Polish, Listing Details & Credit Exhaustion Milestone
- **Timestamp:** 2026-11-22 21:20 IST  
- **Agent Roles Used:** `explore`, `editor`, `tester`
- **Prompt given to Nexen:**
  *"Start with batch 1 open issues: receiver_paid calculation, pickup-by display, volunteer pickup instructions, expired banner, and manifest description."*
- **Actions Executed:**
  - `server/services/impact.js`: Updated `receiver_paid` to compute from `payments.receiver_charge` (evaluates to 0 by DB CHECK constraint).
  - `client/src/pages/ListingDetail.jsx`: Added "Pick up by [timestamp]", changed empty allergen text to "None declared", rendered prominent "EXPIRED" banner when window is 0 or status is expired, and wired volunteer pickup instructions.
  - `client/src/api/client.js`: Updated `getListing(id, role)` to pass role query parameter so volunteer instructions are returned to volunteer users.
  - `client/public/manifest.json`: Added descriptive metadata for PWA installability.
  - Final full build verification executed: `npm run build` completed with code 0 (48 modules, 9 PWA precache entries).
- **Milestone Reached:** Subagent hit platform token limit (`BalanceExhausted: Shared balance exhausted`). All core application functionality, routes, and UI components were completely finalized and built before platform credit exhaustion.

---

### Entry 008 — Post-Exhaustion Infrastructure Hardening, CI/CD Pipeline & Cloud Deployment
- **Timestamp:** 2026-11-22 22:45 IST  
- **Context:** Following platform token limit exhaustion in Codebenders IDE (`BalanceExhausted`), transitioned to production hardening, CI/CD pipeline automation, and container ingress networking.
- **Actions Executed:**
  - **CI/CD Pipeline (`.github/workflows/ci.yml`):** Implemented automated GitHub Actions workflow on Node.js 22 to test production builds and verify server syntax/route integrity on every push and PR.
  - **Cloud Container Build Script Hardening (`package.json`):** Updated root build script (`"build": "cd client && npm install && npm run build && cd ../server && npm install"`) ensuring server dependencies (`express`, `better-sqlite3`) are properly installed in cloud build containers alongside the client PWA.
  - **Container Host Binding (`server/index.js`):** Explicitly bound Express server to `0.0.0.0` (replacing implicit `localhost` binding) to allow Railway/Render edge proxies to route ingress HTTP traffic into the container.
  - **Database Path Normalization (`server/db/connection.js`):** Added robust path resolution logic to handle both root and nested `/server` execution contexts cleanly.
  - **Repository Hygiene & Untracking:** Untracked local `.vscode/settings.json`, added `.vscode/` to `.gitignore`, and pushed clean repository state to GitHub.
- **Result:** Automated CI/CD test suite verified green, working tree clean, and live deployment container operational.

---

## Summary (Final Deliverable)

| Metric | Final Value | Target |
|---|---|---|
| Total Nexen prompt cycles logged | 8 | 6–8 |
| Backend files generated & verified | 11/11 | 11 |
| Frontend files generated & built | 26/26 | 25+ |
| PWA assets & Service Worker | Verified (`client/dist/sw.js`) | Verified |
| API endpoints verified | 6/6 | 6 |
| Database seeded | Yes (`rescue.db`) | Yes |
| CI/CD Pipeline | Automated GitHub Actions (`ci.yml`) | Active |
| Build status | `client` builds cleanly (exit 0) | Clean build |

---

## Key Architectural Decisions Logged

| Decision | Why | Prompt # |
|---|---|---|
| Enforce `receiver_charge = 0` at DB level | Core social equity mandate — receivers must never be billed | Entry 001, 003, 007 |
| Lazy expiry on `GET /available` | Eliminates background cron complexity for hackathon demo stability | Entry 003 |
| Four-component visible score breakdown | Directly satisfies 20% Problem & User Clarity judging criterion | Entry 003 |
| Drop `notes` from seed | Avoided schema migration thrash during server bootstrap | Entry 003 |
| Pure-Node PWA icon generator (`make-icons.mjs`) | Avoided heavy external image library dependencies in Vite container | Entry 005 |
| Scoped `cost_per_meal_saved` to delivered listings | Accurate CSR unit economics reflecting real delivered volume | Entry 006 |
| Volunteer instruction role gating | Privacy protection: donor address details only revealed to assigned volunteers | Entry 006, 007 |
| Explicit `0.0.0.0` host binding | Ensures cloud container edge proxies route incoming HTTP traffic | Entry 008 |
| Unified root build install script | Eliminates container runtime failures from missing server modules | Entry 008 |
| Automated GitHub Actions CI pipeline | Continuous integration validating syntax and build integrity | Entry 008 |
