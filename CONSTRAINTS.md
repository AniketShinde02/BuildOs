# CONSTRAINTS.md — Engineering Guardrails & Technical Constraints

## 1. Architectural Constraints
- **Framework**: Next.js (App Router, React 19 / Server Components first).
- **Next.js 15 Route Parameters**: All dynamic route handlers (e.g., `/api/content/jobs/[id]/route.ts`) MUST unwrap `params` asynchronously using `await params`. Synchronous `params.id` access will cause runtime route crashes.
- **Client Boundaries**: Keep `'use client'` minimal and isolated to interactive leaf components.
- **UI System**: MUI (`baselightTheme` — Charcoal/Amber palette). Avoid raw inline style hacks and maintain dark mode token consistency.
- **Real-Time Streaming**: Use Server-Sent Events (SSE) via `ReadableStream` for job telemetry. Close SSE streams cleanly upon terminal states (`READY`, `FAILED`).
- **State & Database**: Firestore for Events & Drafts, in-memory job registry for active generation sessions.

## 2. Pipeline & AI Agent Constraints
- **Single Responsibility Principle (SRP)**: Each pipeline agent in `src/lib/studio/engine/v2/agents/` must perform exactly one function (Intent, Research, Strategy, Drafting, Humanizing, Carousel, Visuals, QA).
- **Human-in-the-Loop Pauses**: The engine must transition to `WAITING_FOR_APPROVAL` upon completing the strategy phase, never running generation silently until approved (unless invoked via automated batch workflows where auto-approval is explicitly enabled).
- **Model Fallbacks**: All LLM calls must pass through resilient multi-tier fallback chains (SenseNova -> Mistral -> OpenRouter -> Local dynamic catalog).

## 3. Performance & Code Quality Constraints
- **Strict TypeScript**: No `any` casting unless strictly necessary for third-party dynamic payloads.
- **No Unused Abstractions**: Apply YAGNI principle strictly. Do not build speculative wrappers or unused configs.
- **Fetch & Polling Deduplication**: Never use polling loops on routes where SSE streams are active. Ensure background dashboard pollers unwrap the API response schema directly without superfluous wrapper nesting.
- **Tree Cleanliness**: Zero unused imports or unreferenced variables in production code.

## 4. Security & API Protections
- **Input Validation**: Validate all inbound payloads via Zod/Valibot schemas before processing.
- **Secrets & Credentials**: Never hardcode API keys or secrets into source files; use `.env.local` or secure environment variables.

