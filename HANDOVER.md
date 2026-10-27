# HANDOVER.md — BuildOS / LinkedIn Automation Workspace

## Project Overview
BuildOS is an enterprise-grade AI-powered Content Intelligence and Creative Operating System designed for high-impact LinkedIn content generation, carousel design, multi-stage agent orchestration, schedule management, and cross-platform publishing.

## Key Workflows & Entrypoints
- **Root Repository**: `d:\Linkedin Automation`
- **BuildOS Application Package**: `BuildOS/package/`
- **Development Server**: `npm run dev --prefix BuildOS/package` (runs on `http://localhost:3001`)
- **Main App Router**: `BuildOS/package/src/app`
- **Creative Studio UI**: `BuildOS/package/src/app/(DashboardLayout)/studio/create/page.tsx`
- **Content Engine V2**: `BuildOS/package/src/lib/studio/engine/v2/`
- **Publishing Adapters**: `BuildOS/package/src/lib/publishers/` (e.g., `PostizAdapter.ts`, LinkedIn API handlers)

## Status & Active Modules
1. **Content Intelligence & Creative OS V2 (`src/lib/studio/engine/v2/`)**:
   - Event-driven orchestration (`ContentOperatingSystem.ts`, `ContentEventBus.ts`).
   - 10 Specialized Pipeline Agents:
     - `01_IntentAnalyst`: Intent extraction & audience profiling.
     - `02_ResearchPlanner`: Targeted query generation.
     - `03_WebResearcher`: Live search & data retrieval.
     - `05_ContentStrategist`: Angle & brief creation.
     - `06_ContentWriter`: High-density draft writing.
     - `07_Humanizer`: Tone refinement & cliché removal.
     - `08_CarouselArchitect`: Multi-slide pagination & structure.
     - `09_VisualDirector`: Visual styling, color palettes, and layout specs.
     - `10_QualityAssurance`: Formatting, constraint, and readability checks.
2. **Streaming Execution & Human-in-the-Loop Approval API**:
   - `POST /api/content/jobs`: Starts generation job asynchronously.
   - `GET /api/content/jobs/[id]`: Point-in-time state fetcher.
   - `GET /api/content/jobs/[id]/stream`: Server-Sent Events (SSE) telemetry stream.
   - `POST /api/content/jobs/[id]/approve`: Interactive user approval & brief modification gateway.
3. **Execution Workspace UI Components (`src/app/(DashboardLayout)/studio/components/`)**:
   - `ExecutionTimeline.tsx`: Live step-by-step pipeline tracker.
   - `AIResearchTracker.tsx`: Live research queries and synthesis inspector.
   - `ApprovalGate.tsx`: Interactive brief review & edit modal.
   - `StageDetailPanel.tsx`: Telemetry and artifact inspector.
4. **Publishers & Distribution**:
   - Multi-channel adapter layer integrating external services (Postiz, direct APIs).
5. **UI System**:
   - MUI Next.js App Router setup with dark `baselightTheme` (Charcoal / Amber design system).
6. **Local Skills & Design Intelligence Kit (`.agents/skills/`)**:
   - 26 Project-level skills active locally (including `checklist-design`, `component-catalogs-and-ui-kits`, `high-end-visual-design`, `stitch-design-taste`, `minimalist-ui`, `gpt-taste`, `brandkit`, `logo-design`, `ponytail`, `archify`, `system-design`, `web-perf`, `rate-limiting`, etc.).

## AI Agent Instructions & Guardrails
- Refer to `.agents/rules/AGENTS.md` and `CONSTRAINTS.md` before making architectural modifications.
- Ensure all dependency edits preserve existing API contracts.
- Maintain `CHANGELOG.md` with every significant modification.


