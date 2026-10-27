# BuildOS — Content Intelligence & Creative Operating System

BuildOS is an enterprise-grade AI-powered Content Intelligence and Creative Operating System designed for high-impact LinkedIn content creation, carousel generation, multi-stage agent orchestration, and automated social publishing.

---

## ✨ Key Capabilities

- 🤖 **10-Agent Pipeline (V2 Engine)**: Autonomous agent pipeline executing Intent Analysis, Research Planning, Web Research, Strategy, Drafting, Humanizing, Carousel Architecture, Visual Direction, and QA.
- ⚡ **Real-Time Telemetry Streaming**: Low-latency Server-Sent Events (SSE) deliver live stage progress, execution latencies, and agent thought logs.
- 🛡️ **Human-in-the-Loop Approval Gate**: Interactive preview allowing users to inspect and refine generated content briefs, angles, and key takeaways before rendering.
- 🎨 **Multi-Slide Carousel Rendering**: Automated multi-slide generation powered by Satori with custom typography, layouts, and curated color palettes.
- 🔄 **Multi-Tier AI Fallback Routing**: Resilient LLM cascading (SenseNova -> Mistral -> OpenRouter dynamic catalog) to guarantee 99.9% generation uptime.
- 📱 **Social Media Publishing Hub**: Multi-channel distribution via Postiz and direct social API integrations.

---

## 🏗️ Architecture Overview

```
[ Next.js 15 UI / Studio Workspace ]
            │
            ├──► POST /api/content/jobs (Start Job)
            ├──► GET  /api/content/jobs/[id]/stream (SSE Telemetry Stream)
            ├──► POST /api/content/jobs/[id]/approve (Human-in-the-Loop Gate)
            │
[ Content Operating System V2 Engine ]
            │
            ├──► 10 Specialized Agents (src/lib/studio/engine/v2/agents/)
            ├──► Event-Driven EventBus (ContentEventBus.ts)
            └──► Multi-Slide Satori Renderer (Satori / Canvas)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- `pnpm` or `npm`
- Docker (optional, for Postiz publishing services)

### 2. Installation
```bash
# Navigate to package directory
cd BuildOS/package

# Install dependencies
npm install
```

### 3. Environment Configuration
Ensure `.env.local` exists in `BuildOS/package/` with appropriate API keys:
```env
PORT=3001
SENSENOVA_API_KEY=your_sensenova_key
MISTRAL_API_KEY=your_mistral_key
OPENROUTER_API_KEY=your_openrouter_key
```

### 4. Development Server
```bash
# Start the web development server (Port 3001)
npm run dev

# Or start with background publishing services
npm run dev:all
```

---

## 📂 Key Directory Structure

```
BuildOS/package/
├── src/
│   ├── app/
│   │   ├── (DashboardLayout)/
│   │   │   └── studio/             # Studio UI & Generation Workspace
│   │   │       ├── components/     # ExecutionTimeline, ApprovalGate, etc.
│   │   │       └── create/         # Studio Creation Page
│   │   └── api/
│   │       └── content/jobs/       # Job Lifecycle, SSE Stream & Approval routes
│   ├── lib/
│   │   ├── studio/engine/v2/       # Content Operating System & 10 Agents
│   │   └── publishers/             # Postiz & Social Adapters
│   └── utils/                      # Theme, Formatting & Configs
├── .agents/                        # AI Engineering Guardrails & Skills
├── CHANGELOG.md                    # Detailed Version History & Release Notes
├── ARCHITECTURE.md                 # System Topology & Data Lineage
├── CONSTRAINTS.md                  # Engineering Guardrails & Rules
└── HANDOVER.md                     # Active Project State & Handover Notes
```

---

## 📜 License
MIT License — Free for personal and commercial use.

