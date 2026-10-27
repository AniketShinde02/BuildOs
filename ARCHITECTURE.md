# ARCHITECTURE.md — System Topology & Architecture

## System Overview
BuildOS is a multi-layered platform combining a Next.js App Router frontend, an event-driven Content Intelligence & Creative Operating System (V2), real-time Server-Sent Events (SSE), and third-party social media adapters (Postiz, LinkedIn API).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js App Router UI                           │
│  - Studio Create Page (`studio/create/page.tsx`)                      │
│  - Real AI Execution Workspace (Timeline, ApprovalGate, DetailPanel)    │
└───────────────────┬───────────────────────────────▲────────────────────┘
                    │                               │
       POST /jobs   │                               │ SSE Stream
     POST /approve  │                               │ /api/content/jobs/[id]/stream
                    ▼                               │
┌───────────────────────────────────────────────────┴────────────────────┐
│              Content Operating System V2 (Execution Engine)            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        ContentEventBus                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Stage 1: Intent Analysis        ──► 01_IntentAnalyst.ts               │
│  Stage 2: Research Planning      ──► 02_ResearchPlanner.ts             │
│  Stage 3: Web Research           ──► 03_WebResearcher.ts               │
│  Stage 4: Content Strategy       ──► 05_ContentStrategist.ts           │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Human-in-the-Loop Approval Gate                     │  │
│  │  (Pauses execution until user approves/edits content brief)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Stage 5: Drafting               ──► 06_ContentWriter.ts               │
│  Stage 6: Humanizing             ──► 07_Humanizer.ts                   │
│  Stage 7: Carousel Architecture  ──► 08_CarouselArchitect.ts           │
│  Stage 8: Visual Design          ──► 09_VisualDirector.ts              │
│  Stage 9: Quality Assurance      ──► 10_QualityAssurance.ts            │
│  Stage 10: Multi-Slide Satori    ──► Renderers & Format Output         │
└───────────────────┬────────────────────────────────────────────────────┘
                    │
                    ├──► Firestore (Events, Drafts, Post History)
                    └──► Publishers (PostizAdapter.ts, Direct LinkedIn)
```

## Directory Structure & Responsibilities
- `BuildOS/package/src/app`: Application routes, pages, and layouts.
  - `(DashboardLayout)/studio/`: Creative Studio UI & Creation Workspace.
  - `api/content/jobs/`: Job initialization, SSE stream, and approval gate endpoints.
- `BuildOS/package/src/lib/studio/engine/v2/`: Multi-agent Content Operating System engine.
  - `agents/`: 10 discrete pipeline agents adhering to single responsibility.
  - `models/`: Job state machine definitions (`ContentJob.ts`) and event schemas (`ContentExecutionEvent.ts`).
- `BuildOS/package/src/lib/publishers/`: Social media publishing integration adapters.
- `BuildOS/package/src/utils/theme`: Design system colors and MUI theme definitions (`baselightTheme`).
- `.agents/`: Project AI engineering guardrails, skills, and rule sets.

## Data Lineage & Execution Flow
1. **Job Creation**: Frontend calls `POST /api/content/jobs` with the user prompt, slide count, and template choice.
2. **Stream Connection**: Browser connects to `GET /api/content/jobs/[id]/stream` via SSE to receive real-time execution events.
3. **Research & Strategy**: Agents 1-4 execute in sequence, emitting telemetry events and producing the Content Brief.
4. **Approval Gate**: Pipeline transitions to `WAITING_FOR_APPROVAL` state. The UI opens `ApprovalGate.tsx` for review.
5. **Generation & Polish**: Upon approval POST (`/api/content/jobs/[id]/approve`), Agents 5-9 execute drafting, humanizing, carousel layout, visual direction, and QA validation.
6. **Rendering & Export**: Multi-slide Satori renderer builds the visual cards and saves the final draft to Firestore.

