# Docker & Postiz Architecture Archive Note

> **Status**: ARCHIVED & REMOVED FOR DISK SPACE OPTIMIZATION  
> **Date**: October 27, 2026  
> **Space Reclaimed**: **~24.5 GB**  
> **Target Reclaimed Footprint**: Root directory reduced from **~26.0 GB** down to **~1.5 GB**  

---

## 1. Executive Summary & LinkedIn Automation Independence

### Can LinkedIn Automation Run Without Docker?
**YES. 100% independently.**

The core LinkedIn automation engine that was custom coded does **NOT** require Docker, Postiz, PostgreSQL, or Redis. It is an end-to-end native system:
1. **Frontend & Orchestration**: Next.js 16 (App Router) running standalone on port 3001 via `npm run dev`.
2. **AI Generation Pipeline (Studio Engine v2)**: 10 specialized AI agents (`01_IntentAnalyst` through `10_QualityAssurance`) calling Google Gemini directly via `@google/generative-ai`.
3. **Card & Banner Generation**: Native Next.js Satori (`next/og`) rendering dynamic carousels and infographics directly in Node.js using local Inter fonts (`public/fonts/`).
4. **Publishing Adapter (`NativeLinkedInAdapter.ts`)**: Direct HTTP calls to LinkedIn's official REST API endpoints:
   - `https://api.linkedin.com/v2/userinfo` (User authentication)
   - `https://api.linkedin.com/v2/organizationAcls` (Company page support)
   - `https://api.linkedin.com/v2/assets?action=registerUpload` (Feedshare image uploads)
   - `https://api.linkedin.com/v2/ugcPosts` (Post publication)
5. **Database & Storage**: Google Cloud Firestore (events, drafts, and OAuth credentials).

---

## 2. What Was Removed and Why

The repository directory size was exceeding **26 GB** due to two unrelated heavy additions:

| Path Removed | Original Size | Reason for Removal |
|---|---|---|
| `d:\Linkedin Automation\font-library/` | **16.88 GB** | Complete clone of `fontsource/font-files` (1800+ fonts). BuildOS does NOT use this; it only uses 4 Inter font files in `public/fonts/`. |
| `d:\Linkedin Automation\BuildOS\package\public\fonts\fontsource/` | **0.87 GB** | Abandoned bare `.git` directory from an interrupted font clone. Zero fonts were used. |
| `d:\Linkedin Automation\.code-review-graph\graph.db` | **3.51 GB** | Local SQLite index cache generated when indexing the 16.88 GB font directory. |
| `d:\Linkedin Automation\BuildOS\.code-review-graph\graph.db` | **3.23 GB** | Duplicate SQLite index cache in the BuildOS subfolder. |
| `docker-compose.yml` (Root & Package) | **< 1 MB** | Docker setup for Postiz microservice (multi-channel social media scheduler). Removed to eliminate container/image bloat. |

**Total Space Reclaimed: ~24.49 GB**

---

## 3. Preserved Docker Compose Specification (For Future Restoration)

If you ever wish to re-enable Postiz for multi-social media scheduling (Threads, Bluesky, Discord, Reddit, X, YouTube, etc.), simply recreate `docker-compose.yml` with the following configuration:

```yaml
services:
  postiz-db:
    image: postgres:15-alpine
    container_name: postiz-db
    restart: always
    environment:
      POSTGRES_USER: postiz
      POSTGRES_PASSWORD: postiz_secure_password_2026
      POSTGRES_DB: postiz_db
    ports:
      - "5432:5432"
    volumes:
      - postiz_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postiz -d postiz_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  postiz-redis:
    image: redis:alpine
    container_name: postiz-redis
    restart: always
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  postiz-app:
    image: ghcr.io/gitroomhq/postiz-app:latest
    container_name: postiz-app
    restart: always
    ports:
      - "5000:5000"
    environment:
      MAIN_URL: "http://localhost:5000"
      FRONTEND_URL: "http://localhost:5000"
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:5000/api"
      DATABASE_URL: "postgresql://postiz:postiz_secure_password_2026@postiz-db:5432/postiz_db?schema=public"
      REDIS_URL: "redis://postiz-redis:6379"
      IS_GENERAL: "true"
      JWT_SECRET: "postiz_super_secret_jwt_key_2026_buildos"
      STORAGE_PROVIDER: "local"
    depends_on:
      postiz-db:
        condition: service_healthy
      postiz-redis:
        condition: service_healthy

volumes:
  postiz_postgres_data:
```

### How to Restore Postiz in Future
```bash
# 1. Start Docker containers:
docker compose up -d

# 2. In BuildOS .env.local, configure:
POSTIZ_API_URL="http://localhost:5000/api"
POSTIZ_API_KEY="your-postiz-api-key"
```

---

## 4. How to Clean Up Any Existing Docker Desktop Disk Cache

If Docker Desktop has old images or volumes downloaded locally, run:
```bash
# Remove Postiz containers and volume:
docker volume rm postiz_postgres_data

# Remove unused Docker images to free up C: drive space:
docker image rm ghcr.io/gitroomhq/postiz-app:latest postgres:15-alpine redis:alpine
```

---

## 5. How to Run LinkedIn Automation (Zero Docker Required)

1. Open terminal in `d:\Linkedin Automation\BuildOS\package`:
   ```bash
   cd "d:\Linkedin Automation\BuildOS\package"
   npm run dev
   ```
2. Navigate to: `http://localhost:3001`
3. The application will run 100% natively using your Firebase credentials and LinkedIn API tokens configured in `.env.local`.
