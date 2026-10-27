---
name: system-design
description: Expert system design and software architecture discipline to prevent bad design, microservices complexity theater, state desynchronization, unindexed DB queries, memory leaks, and brittle interfaces.
---

# System Design & Architectural Excellence Skill

This skill governs end-to-end system design, architectural patterns, data flow boundaries, and failure mode mitigation for all web, backend, desktop, mobile, and AI agent applications.

## 🎯 Core Directive
Never design fragile, overly complex, or unscalable software. Every architecture decision must prioritize:
1. **Predictability & Simplicity**: YAGNI, low cognitive load, zero unnecessary microservices or distributed complexity.
2. **Data Integrity & Consistency**: ACID transactions, strict schema validation at entry points, idempotency for writes.
3. **Performance & Efficiency**: Low latency, indexed database access, minimal network round-trips, SSR-first web UI.
4. **Resilience & Fault Isolation**: Circuit breakers, graceful fallbacks, explicit error boundaries, zero silent failures.

---

## 🏛️ 1. Architectural Guardrails (The Anti-Bad-Design Matrix)

| Failure Mode / Bad Design Pattern | Consequence | Mandated Architectural Solution |
| :--- | :--- | :--- |
| **Monolithic God Component / God File** | Impossible to test, frequent regression bugs | Single Responsibility Principle (SRP). Split into 150-400 line domain modules. |
| **Direct DB Queries in Client UI** | Exposed credentials, unthrottled DB load | Transport layer / API gateway / Server Actions / tRPC routers with Zod input validation. |
| **Client-side Fetching Spikes / Waterfall** | High layout shift, browser lag, rate limit bans | Server-Side Rendering (SSR), Server Components, cached queries, request deduplication. |
| **State Desynchronization** | Phantom UI updates, stale data | Single source of truth (DB schema / ORM), optimistic UI with rollback handling. |
| **Unindexed N+1 Database Queries** | Database CPU thrashing, server crash | Explicit DB indexes, eager loading (`JOIN`), batching via DataLoader or single query. |
| **Unbounded In-Memory Queues** | Out-Of-Memory (OOM) process crashes | Persistent Redis/Valkey queues with strict max concurrency & dead-letter queues. |
| **Hardcoded Third-Party API Calls** | App freeze on external outage | Timeout boundaries (3-5s), retries with exponential backoff, circuit breakers. |

---

## 🔬 2. System Architecture Layers

```
                     +---------------------------------------+
                     |         Client / Presentation         |
                     |  (RSC, Mobile, React, Desktop App)    |
                     +-------------------+-------------------+
                                         |
                                         v  (Zod validated schema)
                     +-------------------+-------------------+
                     |       API Transport Layer (tRPC /     |
                     |       Server Actions / REST Controller)|
                     +-------------------+-------------------+
                                         |
                                         v
                     +-------------------+-------------------+
                     |         Domain Service Layer          |
                     |   (Business Logic, Auth, Policies)    |
                     +-------------------+-------------------+
                                         |
                        +----------------+----------------+
                        |                                 |
                        v                                 v
   +--------------------+------------------+    +---------+--------------------+
   |   Data Access Layer (Repository/ORM)  |    |  External Integrations / AI  |
   +--------------------+------------------+    +---------+--------------------+
                        |                                 |
                        v                                 v
   +--------------------+------------------+    +---------+--------------------+
   |     Database (Postgres / SQLite)      |    |  Queue / Cache (Redis/Upstash)|
   +---------------------------------------+    +------------------------------+
```

---

## 📐 3. System Design Checklist (Before Writing Any Architecture Code)

- [ ] **Data Flow**: Is the path of data clearly defined from input -> validation -> domain logic -> persistence -> UI response?
- [ ] **State Ownership**: Which component owns the state? (Avoid duplicate state variables across parent/child components).
- [ ] **Concurrency & Idempotency**: Are write operations safe against double-clicks, duplicate webhooks, or concurrent user requests?
- [ ] **Caching Strategy**: Are read-heavy paths cached (Redis/stale-while-revalidate)? Is cache invalidation explicit?
- [ ] **Observability**: Are errors logged with structured context (request ID, user ID, timestamp) without leaking PII?
- [ ] **Resource Limits**: Are payload sizes, query pagination limits, and rate limits configured?

---

## 🛠️ 4. Verification & QA

Before declaring a system architecture complete:
1. Run Archify diagram generation (`npx skills use tt-a1i/archify`) to visualize runtime components and trust boundaries.
2. Verify all database models have indexes on foreign keys and frequently queried fields.
3. Audit API contracts to ensure strict Zod / JSON Schema validation.
