# Prompt Log — Rescue the Surplus
**Maintained by:** Anubhav Anand  
**Purpose:** Required submission item — Codebenders usage details, key prompts, and iterations  
**Format:** Log of all major Nexen interactions, iterations, and results during development  

> ⚠️ **Evaluation Reference:** Scored under *Build Quality and Use of Codebenders (15%)*. This document records the live prompt engineering and agent orchestration across the build.

---

## Log Entries

---

### Entry 001 — Initial System Scaffold & Working Directory Alignment
**Timestamp:** 2026-11-22 17:50 IST  
**Prompt given to Nexen:**
```markdown
You are building a production-quality web application for the ACE Builders Hackathon 2026.
Project: Rescue the Surplus (PWA, React 18 + Vite, Express, SQLite, 5 screens).
[Full architecture prompt from 11-NEXEN-FIRST-PROMPT.md containing repository tree, schema, seed data, API routes, scoring algorithm, and screen definitions]
```
**What Nexen generated:**
- Root `package.json` with concurrent dev/build scripts
- Root `.gitignore` and `.env.example`
- Directory scaffolding for `server/` (`db/`, `middleware/`, `routes/`, `services/`)

**Iterations needed:**
- Nexen initially created a nested `rescue-surplus-food/rescue-surplus-food/` subfolder based on the root ASCII tree diagram.
- Clarified working directory to Nexen: current directory (`.`) is already the git repo root.
- Nexen ran cleanup to remove the empty nested directory and keep the repo root flat.

**Result:** Partial — root configuration files successfully generated; folder structure aligned.

---

### Entry 002 — Granular File Generation & Subagent Permission Handling
**Timestamp:** 2026-11-22 17:57 IST  
**Prompt given to Nexen:**
```markdown
The folders (server/db, server/middleware, server/routes, server/services) already exist on disk. Proceed with writing the server files one by one, starting with server/package.json, verifying each on disk before moving to the next.
```
**What Nexen generated:**
- `server/package.json` with dependencies (`better-sqlite3`, `express`, `cors`)

**Iterations needed:**
- Nexen's `editor` subagent encountered a write gate limit when attempting to output all 11 files in a single pass.
- Steered Nexen to use single-file sequential generation to prevent subagent tool-call timeouts.
- Granted tool write permissions in Codebenders IDE.

**Result:** Working — `server/package.json` verified on disk and passed JSON linting.

---

### Entry 003 — Full Server Implementation & Smoke Test Execution
**Timestamp:** 2026-11-22 18:10 IST  
**Prompt given to Nexen:**
```markdown
Build the server first: implement schema.sql, connection.js, seed.js, services, and the Express routes inside server/ from 02-TECH-ARCHITECTURE.md.
```
**What Nexen generated:**
- `server/db/schema.sql` (enforcing `CHECK (receiver_charge = 0)` on `payments`)
- `server/db/connection.js` (better-sqlite3 singleton)
- `server/db/seed.js` (synthetic dataset with donors, receivers, volunteers, listings)
- `server/middleware/validate.js` (input sanitization and 400 error handlers)
- `server/services/matching.js` (4-part scoring: distance, quantity fit, time-to-spoil, need)
- `server/services/expiry.js` (lazy listing expiration service)
- `server/services/impact.js` (transparent metrics and formula calculation)
- `server/routes/listings.js` & `server/routes/impact.js`
- `server/index.js` (Express entry point on port 3001)

**Iterations needed:**
- Seed spec conflict: Handled a prompt on listing `notes` field by selecting "Drop notes" to preserve pristine schema integrity without unnecessary database migrations.
- Tested all routes via Nexen's automated tester subagent.

**Result:** Verified & Working — Port 3001 responded to live curl checks:
- `GET /api/listings/available` returned 200 with 4 score components (top match: 0.77).
- `GET /api/impact` returned 200 with full formula metadata and funding split.
- `GET /api/listings/:id` returned 200 with safety disclaimer and allergen list.
- Validations returned 400 for bad payloads and 422 for illegal state transitions.

---

### Entry 004 — Frontend Client Scaffold & Core Architecture
**Timestamp:** 2026-11-22 18:24 IST  
**Prompt given to Nexen:**
```markdown
The backend is verified and ready. 

Now proceed to building the complete frontend inside ./client:
1. Scaffold Vite + React 18 + TailwindCSS + vite-plugin-pwa in ./client
2. Set up RoleContext (Donor, Receiver, Volunteer, Admin) and the persistent RoleSwitch dropdown
3. Build all five screens:
   - Screen 1: PostSurplus.jsx (donor flow with 60s timer freezing on submit)
   - Screen 2: MatchClaim.jsx (ranked listings with all 4 score components visible + Claim button)
   - Screen 3: StatusBoard.jsx (live board: posted → claimed → collected → delivered)
   - Screen 4: Impact.jsx (metrics with click-to-reveal formulas + funding split showing Receiver: ₹0)
   - Screen 5: ListingDetail.jsx (handling, allergens, bold expiry line, and food safety disclaimer)
4. Wire api/client.js to http://localhost:3001/api

Generate and write the ./client files now.
```
**What Nexen generated:**
- `client/package.json`, `client/vite.config.js`, `client/tailwind.config.js`, `client/postcss.config.js`
- `client/public/manifest.json`, `client/public/offline.html`
- All 5 full screen components in `client/src/pages/`
- All reusable components (`Timer`, `ScoreCard`, `StatusBadge`, `MetricBox`, `Disclaimer`, `RoleSwitch`)
- State management (`RoleContext.jsx`, `useRole.js`, `useTimer.js`)
- API client wrapper (`api/client.js`)

**Iterations needed:**
- Explicitly corrected relative path targeting to `./client/` rather than `rescue-surplus-food/client/`.

**Result:** Working — All 25 React and PWA source files created.

---

### Entry 005 — PWA Shell Completion, Icon Asset Generation & Production Build
**Timestamp:** 2026-11-22 18:38 IST  
**Prompt given to Nexen:**
```markdown
Finish client/src/App.jsx and build the client:
1. Update `client/src/App.jsx` to wrap in RoleProvider, render header RoleSwitch, render active screen, and render bottom navigation tabs (≥48px).
2. Generate icon-192.png and icon-512.png.
3. Run npm install and npm run build in client/ to verify.
```
**What Nexen generated:**
- `client/src/App.jsx` complete with header, bottom tab bar (≥48px), and screen routing
- `client/scripts/make-icons.mjs` (PNG generator utilizing zlib and fs)
- `client/public/icon-192.png` (192×192) and `client/public/icon-512.png` (512×512)
- Production build compilation into `client/dist/` (service worker `sw.js`, manifest, assets)

**Iterations needed:**
- Verified that all modules bundled cleanly without syntax or import errors.

**Result:** Fully Verified — `npm run build` exited with code 0 (48 modules transformed, 9 PWA precache entries, bundles generated).

---

## Summary (Updated live)

| Metric | Current Value | Target |
|---|---|---|
| Total Nexen prompts used | 5 | 6–8 |
| Backend files generated & verified | 11/11 | 11 |
| Frontend files generated & built | 26/26 | 25+ |
| PWA assets & Service Worker | Verified (`client/dist/sw.js`) | Verified |
| API endpoints verified | 6/6 | 6 |
| Database seeded | Yes (`rescue.db`) | Yes |
| Build status | `client` builds cleanly (exit 0) | Clean build |

---

## Key Architectural Decisions Logged

| Decision | Why | Prompt # |
|---|---|---|
| Enforce `receiver_charge = 0` at DB level | Core social equity mandate — receivers must never be billed | Entry 001, 003 |
| Lazy expiry on `GET /available` | Eliminates background cron complexity for hackathon demo stability | Entry 003 |
| Four-component visible score breakdown | Directly satisfies 20% Problem & User Clarity judging criterion | Entry 003 |
| Drop `notes` from seed | Avoided schema migration thrash during server bootstrap | Entry 003 |
| Pure-Node PWA icon generator (`make-icons.mjs`) | Avoided heavy external image library dependencies in Vite container | Entry 005 |
