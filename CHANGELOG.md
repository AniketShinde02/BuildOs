# Changelog

All notable changes to this project will be documented in this file.

## [2026-10-27] — Docker & Third-Party Bloat Removal: 24.5 GB Space Reclamation

### Author
- Antigravity AI
- Machine: JinWoo-PC (Windows Local Environment)

### Architecture & Infrastructure
- **Native LinkedIn Automation Verified**: Confirmed that core LinkedIn publishing is 100% native via `NativeLinkedInAdapter.ts` and Next.js Satori image generator, operating directly over LinkedIn REST API v2 and Firestore without requiring Docker.
- **Docker Compose Cleanup**: Permanently deleted `docker-compose.yml` from root and `BuildOS/package/docker-compose.yml` (Postiz, PostgreSQL 15, and Redis microservices).
- **Package Scripts Sanitization**: Removed `dev:services` and `dev:all` Docker commands from `BuildOS/package/package.json`.
- **Preserved Archive Manifest**: Created `DOCKER_POSTIZ_ARCHIVE_NOTE.md` and `DOCKER_POSTIZ_ARCHIVE_NOTE.txt` preserving complete compose YAML specs and instructions to restore Postiz in 60s if ever desired.
- **Disk Reclamation**:
  - Removed unused `font-library/` external repository (16.88 GB).
  - Removed abandoned `BuildOS/package/public/fonts/fontsource/.git` clone (0.87 GB).
  - Purged bloated SQLite index graphs (`.code-review-graph/graph.db` - 3.51 GB, and `BuildOS/.code-review-graph/graph.db` - 3.23 GB).
  - Total reclaimed footprint: **~24.49 GB** (Reduced folder size from ~26 GB down to ~1.5 GB).
- **Git Hygiene**: Updated root `.gitignore` to exclude `.code-review-graph/` and `font-library/`.

## [2026-10-01] — Workspace Skills Synchronization & Design Intelligence Kit

### Author
- Antigravity AI
- Machine: JinWoo-PC (Windows Local Environment)

### Added
- **Synchronized 24 Production Design & Architecture Skills into Local `.agents/skills/`**:
  - `checklist-design`: Crawford/Sam Seven-Principle Premium Site Checklist and UI audit standards.
  - `component-catalogs-and-ui-kits`: Component acceleration catalog (shadcn/ui, Aceternity UI, Magic UI, Motion-Primitives, etc.).
  - `design-taste-frontend` & `design-taste-frontend-v1`: Anti-slop frontend and responsive web design patterns.
  - `high-end-visual-design`: Agency-grade design standards, typography, whitespace, and card structures.
  - `minimalist-ui`: Editorial-style typography contrast and warm monochrome design rules.
  - `stitch-design-taste`: Agent-friendly design systems and micro-motion choreography.
  - `gpt-taste`: Advanced layout variance, editorial typography, and GSAP scroll aesthetics.
  - `industrial-brutalist-ui`: Swiss typographic print with terminal aesthetics.
  - `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile`: Elite multimodal image direction and design reconstruction.
  - `brandkit` & `logo-design`: Comprehensive logo library (1,400+ SVGs) and brand system design.
  - `ponytail`: Strict YAGNI, native platform preference, and minimal surgical diffs discipline.
  - `redesign-existing-projects`: High-end modernization for existing web applications.
  - `brag` & `brag-slim`: Automated video showcase generation.
  - `archify` & `archify-review`: System architecture diagram generation and SVG export.
  - `system-design`: Scalable software architecture, indexing, and state desynchronization defenses.
  - `web-perf`: Core Web Vitals, LCP/CLS optimization, and Lighthouse audits.
  - `rate-limiting`: API rate limiting, fraud detection, and risk scoring.
  - `full-output-enforcement`: Complete code generation guarantee.

### Fixed
- **Carousel Route Catch Handler (`src/app/api/og/carousel/route.tsx`)**: Removed unused catch parameter in spec JSON parse block.
- **PublisherFactory Linter Warning (`src/lib/publishers/PublisherFactory.ts`)**: Removed unreferenced `providerConfig` declaration.


### Notes
- All local skills are now isolated within `d:\Linkedin Automation\.agents\skills\` to minimize global prompt token overhead while ensuring maximum design and architecture intelligence.

## [2026-09-30] — Master Content Intelligence & Creative OS V2, Execution Workspace & Stream Architecture


### Author
- Antigravity AI
- Machine: JinWoo-PC (Windows Local Environment)

### Added
- **Content Intelligence & Creative OS V2 Engine (`src/lib/studio/engine/v2/`)**:
  - Implemented decoupled, event-driven multi-agent orchestration architecture orchestrated by `ContentOperatingSystem.ts` and `ContentEventBus.ts`.
  - Built 10 specialized AI execution agents:
    - `01_IntentAnalyst.ts`: Intent extraction, audience profiling, and goal formulation.
    - `02_ResearchPlanner.ts`: Targeted query synthesis and search scope mapping.
    - `03_WebResearcher.ts`: Live data retrieval and factual context synthesis.
    - `05_ContentStrategist.ts`: Angle formulation, messaging pillars, and content brief generation.
    - `06_ContentWriter.ts`: High-density first-draft generation adhering to engineering tone.
    - `07_Humanizer.ts`: Cliché elimination, conversational cadence adjustments, and authentic voice injection.
    - `08_CarouselArchitect.ts`: Multi-slide layout breakdown and visual flow sequencing.
    - `09_VisualDirector.ts`: Theme curation, slide typography, color palettes, and visual hierarchy generation.
    - `10_QualityAssurance.ts`: Automated constraint checking, readability grading, and layout validation.
- **Job & Event Telemetry Model (`src/lib/studio/engine/v2/models/`)**:
  - `ContentJob.ts`: Complete lifecycle state management (`ANALYZING`, `RESEARCH_PLANNING`, `RESEARCHING`, `STRATEGIZING`, `WAITING_FOR_APPROVAL`, `DRAFTING`, `HUMANIZING`, `FORMAT_PLANNING`, `DESIGNING`, `QA`, `READY`, `FAILED`).
  - `ContentExecutionEvent.ts`: Structured execution event schemas with telemetry timestamps, agent IDs, and stage outputs.
- **Real-Time Streaming & Approval API Endpoints (`src/app/api/content/`)**:
  - `POST /api/content/jobs`: Initializes asynchronous generation jobs with unique Job IDs.
  - `GET /api/content/jobs/[id]`: Returns point-in-time job snapshots.
  - `GET /api/content/jobs/[id]/stream`: Server-Sent Events (SSE) route delivering live stage transitions, agent thought logs, and progress metrics.
  - `POST /api/content/jobs/[id]/approve`: Interactive approval gate enabling users to review, edit, or approve generated briefs before drafting.
- **Real AI Execution Workspace UI (`src/app/(DashboardLayout)/studio/components/`)**:
  - `ExecutionTimeline.tsx`: Live step-by-step pipeline tracker showing active status, latencies, agent telemetry, and expandable step logs.
  - `AIResearchTracker.tsx`: Visual search and research synthesis breakdown.
  - `ApprovalGate.tsx`: Interactive brief review UI with live editable outlines, hooks, and tone selectors.
  - `StageDetailPanel.tsx`: Deep-dive inspector for viewing stage payloads, prompts, and intermediate artifacts.

### Changed
- Refactored `src/app/(DashboardLayout)/studio/create/page.tsx` from decorative text progress to a real structured event listener consuming the SSE stream and orchestrating the human approval step.
- Upgraded model cascade in `CreativeDirector.ts` and `CreativeOSEngines.ts` to dynamically handle OpenRouter dynamic catalog and resilient failover across multiple providers.

### Fixed
- **Next.js 15 Async Route Params**: Fixed runtime error (`params.id is a Promise and must be unwrapped with await`) in `src/app/api/content/jobs/[id]/route.ts` and `src/app/api/content/jobs/[id]/approve/route.ts`.
- **DraftsClient Polling Bug**: Resolved issue where `DraftsClient.tsx` improperly destructured `{ job }` from raw JSON response, causing infinite polling loops.
- **Pipeline Status Synchronization**: Updated `DraftsClient.tsx` stage checks from legacy status flags (`GENERATING`, `VALIDATING`) to V2 pipeline statuses (`DRAFTING`, `QA`, `READY`) with automatic approval for dashboard-triggered workflows.
- **Linter & Code Hygiene**: Cleared unused imports (`IconX`, `AnimatePresence`, `Divider`, `Tooltip`, `IconClock`, `IconLoader2`) and resolved unused variable warnings across Studio UI components and core engine files.

### Performance
- Zero frontend polling overhead for the Studio creation flow by switching to persistent Server-Sent Events (SSE) connections.
- Deduplicated model requests and reduced memory footprint with scoped in-memory job persistence and streamlined stage transitions.

### Notes
- Interactive approval gate pauses execution safely without holding open blocking backend processes; client resumes job asynchronously upon `/approve` POST trigger.



## [2026-09-29] — AI Creative Engine Fixes, Multi-Slide Rendering & Fallbacks

### Author
- Antigravity AI
- Machine: JinWoo-PC (Windows Local Environment)

### Added
- Added native SenseNova API integration as primary fallback mechanism in `CreativeDirector.ts`, `CreativeOSEngines.ts`, and `generate-post/route.ts`.
- Injected `SENSENOVA_API_KEY` and `MISTRAL_API_KEY` into local environment configuration.
- Implemented real multi-slide looping renderer in `studio/create/page.tsx` via Satori integration.
- Implemented dynamic UI slide count picker (3-8 slides default) in the Creative OS dashboard.

### Changed
- Upgraded all broken AI engine models (`gemini-3.5-flash`) to valid `gemini-2.0-flash` models to resolve 503 errors and rate-limiting.
- Modified UI generation stages to display real loading metrics instead of a hardcoded 120ms fake loop.
- Removed `postiz-temporal` (heavy orchestration container) from local `docker-compose.yml` to save 1.5GB+ of developer RAM.

### Fixed
- Resolved single-image Carousel bug: The pipeline now executes an N-length slide generation and correctly maps output arrays to the preview pane.
- Resolved silent LLM fallback issues blocking generation workflows.

## [2026-09-29] — Repository AI Engineering Bootstrap & Skills Installation

### Author
- Antigravity AI
- Machine: JinWoo-PC (Windows Local Environment)

### Added
- Initialized physical AI Engineering guardrails: [HANDOVER.md](file:///d:/Linkedin%20Automation/HANDOVER.md), [CONSTRAINTS.md](file:///d:/Linkedin%20Automation/CONSTRAINTS.md), and [ARCHITECTURE.md](file:///d:/Linkedin%20Automation/ARCHITECTURE.md).
- Created localized `.agents/skills/` directory structure.
- Installed `templated-post-generator` skill into `.agents/skills/templated-post-generator/SKILL.md`.
- Installed `buildos-content-engine` skill into `.agents/skills/buildos-content-engine/SKILL.md`.
- Added root [.gitignore](file:///d:/Linkedin%20Automation/.gitignore) excluding `node_modules/`, `.next/`, and build artifacts.
- Installed `agentation` and `boneyard-js` dev dependencies.

### Changed
- Injected and then pruned non-existent `agentation` CLI scripts from [package.json](file:///d:/Linkedin%20Automation/package.json).
- Separated frontend and backend development commands (`npm run dev` for Next.js web application, `npm run dev:services` for Postiz Docker stack, and `npm run dev:all` for full stack).
- Configured dedicated port `3001` via `next dev -p 3001` and `PORT=3001` in [package.json](file:///d:/Linkedin%20Automation/BuildOS/package/package.json) and [.env.local](file:///d:/Linkedin%20Automation/BuildOS/package/.env.local) to avoid port 3000 conflicts with concurrent dev processes.
- Verified `agentation` is already properly mounted as a React component in [layout.tsx](file:///d:/Linkedin%20Automation/BuildOS/package/src/app/layout.tsx#L21) (`{process.env.NODE_ENV === 'development' && <Agentation />}`).

### Fixed
- Cleaned up unused `useRouter` import and `router` variable in [AccountsClient.tsx](file:///d:/Linkedin%20Automation/BuildOS/package/src/app/(DashboardLayout)/accounts/AccountsClient.tsx#L12) to clear IDE linter warning.

### Performance
- Isolated node_modules from tree traversals and graph analyzers via root `.gitignore`.

### Notes
- Verified `code-review-graph` MCP server connection status. Code graph is ready for incremental symbol querying.
