---
name: rate-limiting-abuse-prevention
description: Elite, exhaustive guidelines for production-grade API rate limiting, fraud detection, risk-scoring, and free-trial abuse prevention. Includes Redis architecture, HTTP semantics, and AI cost limits.
---
# GEMINI.md â€” Production Abuse Prevention, Rate Limiting & Resource Guardrails

## Purpose

This document is the implementation contract for the coding agent working on this application.

The goal is **not** to block users aggressively. The goal is to make abuse expensive, bounded, observable, and recoverable while keeping legitimate users working.

This specification covers:

- API rate limiting
- Signup / free-trial abuse
- Login / credential-stuffing protection
- OTP / email-verification abuse
- Password-reset abuse
- Expensive AI / compute endpoints
- Per-user, per-IP, per-device and global limits
- Risk scoring and progressive friction
- Redis-backed distributed throttling
- HTTP 429 behavior
- Logging / metrics / alerting
- Fail-open vs fail-closed behavior
- Testing, load testing and verification
- Agent implementation rules

---

# 1. Non-negotiable principles

## 1.1 Never use IP address as the only identity signal

Do **NOT** implement:

```text
one free trial per IP
one account per IP
one user per IP
```

as the primary business rule.

Shared IPs are normal in:

- homes
- offices
- universities
- hotels
- mobile carriers
- VPNs
- corporate networks

IP is useful as one signal, not proof of identity.

The source material explicitly supports this layered approach: combine weak signals such as IP, device, payment, account history, velocity and behavior into a risk decision rather than pretending one signal is perfect. [SOURCE: user-provided reference]

## 1.2 Rate limiting and fraud detection are different systems

Rate limiting answers:

> "Is this client performing too many operations too quickly?"

Risk scoring answers:

> "Does this activity look suspicious when multiple signals are combined?"

Do not replace one with the other.

## 1.3 Rate-limit expensive operations by cost, not only request count

A request that consumes 5 ms of CPU is not equivalent to one that:

- invokes an LLM
- consumes large token budgets
- performs vector search
- generates media
- uploads/exports a large file
- calls paid third-party APIs
- sends SMS/email
- triggers background jobs

For expensive endpoints, implement both:

1. request-rate limits
2. resource / usage limits

OWASP specifically recommends limiting interaction frequency, payload size, expensive operations and third-party spending exposure. [WEB: OWASP API4:2023]

## 1.4 Never trust the client for security decisions

The backend must enforce all limits.

Client-side counters are UX only.

Never trust:

```text
localStorage
sessionStorage
frontend timers
frontend "remaining requests"
client-supplied device IDs
client-supplied roles
client-supplied quota values
```

---

# 2. Required architecture

Use this logical request path:

```text
Client
  |
  v
CDN / WAF / Edge protection
  |
  v
API Gateway / Reverse Proxy
  |
  v
Application API
  |
  +---- Redis / distributed rate limiter
  |
  +---- Auth / user identity
  |
  +---- Risk / abuse scoring
  |
  +---- Database
  |
  +---- Queue / workers
  |
  +---- AI / paid external providers
```

## Enforcement layers

### Layer A â€” Edge

Purpose:

- absorb obvious volumetric abuse
- block obvious hostile traffic
- rate-limit unauthenticated endpoints
- challenge automated signup/login traffic where appropriate

Cloudflare documents rate limiting for bulk account creation, credential stuffing, excessive API calls and resource exhaustion. [WEB: Cloudflare Rate Limiting]

### Layer B â€” Application

Purpose:

- user-level quotas
- endpoint-specific limits
- business rules
- risk scoring
- trial eligibility
- expensive-operation budgets

### Layer C â€” Resource / provider guardrails

Purpose:

- token budgets
- concurrency caps
- queue limits
- file-size limits
- database query limits
- provider spending caps / alerts

Do not assume edge rate limiting protects the application from expensive authenticated requests.

---

# 3. Rate-limit algorithm

## Preferred default

Use a **token bucket** for general-purpose API throttling.

Alternative:

- sliding window for strict security counters
- fixed window only for simple non-sensitive analytics/quotas

Avoid relying on naive fixed windows for security-sensitive endpoints because requests can bunch around the window boundary.

OWASP's current bot-management guidance recommends token bucket or sliding-window approaches and warns against fixed-window boundary bursts. [WEB: OWASP Bot Management and Anti-Automation Cheat Sheet]

## Distributed implementation

For multiple API instances:

```text
Application instance
       |
       v
Redis
  -> atomic counter / token-bucket operation
       |
       v
allow / throttle / challenge / reject
```

The implementation must be atomic.

Do NOT use:

```text
GET counter
if under limit:
    SET counter + 1
```

without an atomic mechanism.

Use an atomic Redis operation, Lua script, or equivalent distributed limiter.

---

# 4. Baseline rate-limit policy

These are **starting production defaults**, not universal laws.

Tune them using actual traffic.

## 4.1 Public / unauthenticated endpoints

| Endpoint category | Recommended baseline |
|---|---:|
| General GET API | 60 req/min/IP |
| Public search/autocomplete | 60 req/min/IP |
| Public form submit | 10 req/min/IP |
| Signup submission | 5 req/10 min/IP |
| Signup per device | 5 accounts/24h/device |
| Signup per IP | 10 accounts/24h/IP |
| Email verification send | 3/hour/email |
| Email verification resend | 5/hour/account |
| OTP send | 3/10 min/identity |
| OTP verification | 5/10 min/identity |
| Password reset request | 5/hour/account-or-email |
| Login failures | 5/min/account |
| Login failures | 20/10 min/IP |
| Contact/support form | 5/10 min/IP |

These are not hard-coded blindly. Make them configuration values.

## 4.2 Authenticated general API

Start with:

```text
60 requests / minute / user
burst capacity: 20
```

For read-heavy endpoints this can be higher.

For mutation endpoints use stricter per-operation limits.

## 4.3 Expensive AI endpoints

Never use the general API limit as the only protection.

Start with a layered budget:

```text
Per user:
  10 expensive calls / minute
  100 expensive calls / hour
  daily usage quota

Per IP:
  30 expensive calls / minute
```

Then add a **cost budget**:

```text
request_cost = base_cost + token_cost + model_multiplier + workload_multiplier
```

Example:

```text
cheap model call       = 1 unit
standard model call    = 3 units
large context call     = 5 units
image/video generation = 10+ units
```

The exact weights must be based on real infrastructure cost.

Do not expose internal cost weights to the client.

## 4.4 Background jobs

For job-producing endpoints:

```text
per user:
  max queued jobs = 3
  max active jobs = 1-2
```

Also enforce:

```text
maximum job runtime
maximum retries
maximum payload size
maximum output size
maximum daily usage
```

Otherwise an attacker can stay below the request-rate threshold while exhausting worker resources.

---

# 5. Security-sensitive endpoint policy

## 5.1 Login

Protect login with **at least two independent dimensions**:

```text
Bucket A:
  account / username / email

Bucket B:
  IP or IP + network characteristics
```

Do NOT create only:

```text
login:<ip>:<username>
```

as the sole limiter.

That key can be bypassed by trying many usernames from one source.

OWASP explicitly recommends independent per-account and per-IP buckets for credential-stuffing resistance. [WEB: OWASP Bot Management and Anti-Automation]

### Suggested starting policy

```text
Per account:
  5 failed attempts / 5 minutes
  then progressive delay / challenge
  severe abuse -> temporary lockout

Per IP:
  20 failed login attempts / 10 minutes
  100 failed attempts / hour

Per successful account:
  normal traffic limits reset independently
```

Do not permanently lock an account merely because one IP behaved badly.

### Response

For excessive attempts:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
```

Return a generic security-safe response.

Do not tell the attacker:

```text
"username bucket exceeded"
"IP bucket exceeded"
"3 attempts remain"
```

Precise internal diagnostics belong in server logs, not public responses.

---

# 6. Signup / free-trial abuse prevention

## 6.1 Principle

Do not ask:

```text
"Is this definitely the same person?"
```

Ask:

```text
"How suspicious is this signup given all available signals?"
```

The source material and current fraud guidance support this layered/probabilistic approach. [SOURCE: user-provided reference] [WEB: Stripe Free Trial Abuse 2026]

## 6.2 Signals

Possible signals:

### Network

- IP
- subnet
- ASN
- hosting/datacenter ASN
- VPN/proxy indicators
- abnormal signup velocity

### Device

- server-observed device identifier where legally and technically appropriate
- browser/device characteristics
- reuse across accounts
- suspicious rapid device switching

### Account

- email reuse patterns
- disposable email indicators
- account age signals where legitimately available
- repeated trial patterns
- previous abuse history

### Payment

Where the product legitimately collects payment details:

- payment-method reuse
- payment risk
- failed payment history
- prepaid / mismatch indicators when supplied by the payment provider

Do not store raw card data.

Use the payment processor's safe identifiers / risk signals.

### Behavior

- signup -> immediate expensive API usage
- same action sequence repeated across many accounts
- unusually high usage immediately after trial activation
- account creation velocity
- trial cycling after expiration

Stripe's current 2026 guidance describes combining email, device, network, payment and behavioral signals and using progressive friction rather than depending on a single identifier. [WEB: Stripe Free Trial Abuse 2026]

---

# 7. Risk scoring

Implement a configurable risk score.

Example:

```text
risk_score = 0..100
```

Suggested initial weighting:

| Signal | Example points |
|---|---:|
| Reused device linked to expired trial | +35 |
| Same payment identity reused across trial accounts | +40 |
| 5+ signups from same device in 1h | +25 |
| 10+ signups from same IP in 24h | +15 |
| Datacenter/VPN signal | +10 |
| Disposable email signal | +15 |
| Very new/suspicious email signal | +10 |
| Immediate high-value API usage | +15 |
| Repeated trial cycling | +30 |
| Previous confirmed abuse | +50 |

These values are a starting configuration.

Do not claim they are statistically optimal.

## Thresholds

```text
0-29   LOW
30-59  MEDIUM
60-79  HIGH
80-100 VERY_HIGH
```

Suggested actions:

```text
LOW:
  allow signup + normal trial

MEDIUM:
  allow account
  require extra verification OR payment method

HIGH:
  require stronger verification
  restrict high-cost features
  reduce trial quota

VERY_HIGH:
  do not grant another free trial
  or route to manual/automated review
```

Do not automatically ban based on one weak signal.

---

# 8. Progressive friction

Prefer:

```text
allow
  -> challenge
  -> verify
  -> reduce quota
  -> restrict expensive features
  -> deny risky action
```

over:

```text
ALLOW EVERYONE
or
BAN EVERYONE
```

Examples:

### Low risk

```text
normal signup
normal trial
```

### Medium risk

```text
email verification
Turnstile / equivalent bot challenge
payment method required
lower trial quota
```

### High risk

```text
stronger verification
no access to expensive APIs until verified
limited concurrency
limited daily budget
```

### Very high risk

```text
do not issue promotional credit/trial
```

Cloudflare documents combining WAF/network controls with Turnstile/client-side human verification because they solve different parts of the problem. [WEB: Cloudflare Turnstile + WAF]

---

# 9. Free-trial eligibility

Never use:

```text
trial_allowed = !same_ip_used_trial
```

Instead create a trial eligibility decision:

```text
trial_eligibility(
    user,
    account_history,
    device_signals,
    network_signals,
    payment_signals,
    behavior_signals
)
    -> decision
```

Possible decisions:

```text
GRANT
GRANT_WITH_REDUCED_LIMIT
VERIFY_THEN_GRANT
DENY_TRIAL
```

## Trial usage limits

Even legitimate trials must be bounded.

Example:

```text
7-day trial

max expensive AI units:
  100 units/day

max concurrent expensive jobs:
  1

max queued jobs:
  3

max single request cost:
  20 units

max export size:
  configured application limit
```

Adjust these from actual unit economics.

---

# 10. IP handling

## Trusting client IP

If the app is behind a reverse proxy/CDN:

- configure trusted proxy ranges
- use only trusted forwarding headers
- do not blindly trust arbitrary `X-Forwarded-For`
- document the exact proxy chain

The agent must inspect the existing deployment before changing IP extraction.

## IPv4 / IPv6

Do not assume IP strings are unique stable identities.

Normalize carefully.

IPv6 users can have changing addresses / privacy addresses.

Use IP as a network signal, not a human identity.

---

# 11. Device identification

If device intelligence is used:

## Requirements

- privacy/legal review
- minimal collection
- documented retention
- hashed/pseudonymous identifiers where appropriate
- do not make device ID the only account-access control
- do not assume a fingerprint is permanent

Treat device signals as probabilistic.

A user can legitimately:

- change browsers
- use multiple devices
- clear storage
- reinstall the OS
- use a shared machine

Likewise, an attacker can attempt to alter fingerprints.

---

# 12. Redis key design

Use namespaced keys.

Examples:

```text
rl:v1:login:ip:{ip}
rl:v1:login:user:{user_id}
rl:v1:signup:ip:{ip}
rl:v1:signup:device:{device_hash}
rl:v1:otp:identity:{identity_hash}
rl:v1:api:user:{user_id}
rl:v1:api:ip:{ip}
rl:v1:ai:user:{user_id}
rl:v1:ai:ip:{ip}
rl:v1:ai:global
risk:v1:user:{user_id}
risk:v1:device:{device_hash}
trial:v1:eligibility:{identity_hash}
```

Do not place raw sensitive information in keys when a stable hash/pseudonymous representation is sufficient.

Use TTLs appropriate to the policy.

---

# 13. Rate-limit configuration must be centralized

Create one source of truth.

Example conceptual configuration:

```yaml
rate_limits:

  public_api:
    requests: 60
    window_seconds: 60

  signup_ip:
    requests: 5
    window_seconds: 600

  signup_ip_daily:
    requests: 10
    window_seconds: 86400

  login_account_failures:
    requests: 5
    window_seconds: 300

  login_ip_failures:
    requests: 20
    window_seconds: 600

  otp_send:
    requests: 3
    window_seconds: 600

  password_reset:
    requests: 5
    window_seconds: 3600

  ai_expensive:
    requests: 10
    window_seconds: 60
```

Do not scatter magic numbers across controllers.

---

# 14. HTTP behavior

Use:

```http
429 Too Many Requests
```

for rate-limit rejection.

RFC 6585 defines `429 Too Many Requests` and permits `Retry-After`; 429 responses must not be cached. [WEB: RFC 6585]

For ordinary API quotas:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: <seconds>
Content-Type: application/json
```

Example body:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

Do not expose internal bucket names or risk score.

For highly security-sensitive endpoints, avoid making retry timing excessively informative.

---

# 15. Headers

Where appropriate, expose standard operational quota information.

Possible headers:

```text
RateLimit
RateLimit-Policy
Retry-After
```

Do not expose sensitive fraud/risk information.

Cloudflare's API documentation currently uses `Ratelimit`, `Ratelimit-Policy` and `retry-after` examples for API throttling. [WEB: Cloudflare API limits]

---

# 16. Response semantics

The backend should distinguish internally between:

```text
RATE_LIMITED
RISK_CHALLENGE
VERIFICATION_REQUIRED
TRIAL_LIMIT_REACHED
USAGE_QUOTA_EXCEEDED
RESOURCE_BUSY
ABUSE_BLOCK
```

But do not leak unnecessary detection details externally.

Recommended public behavior:

```text
429 -> request too frequent
403 -> request is not authorized / policy denied
401 -> authentication failure
409 -> business-state conflict where appropriate
```

Do not misuse 401/403 for normal throttling.

---

# 17. Concurrency limits

Rate limits alone are insufficient.

Implement concurrency caps for expensive work.

Example:

```text
per user:
  max 1 active AI generation

per account:
  max 3 queued AI jobs

global:
  configurable worker concurrency

provider:
  provider-specific concurrency limit
```

When a job is already running, return a suitable busy/queue response rather than starting unlimited parallel work.

---

# 18. Input and payload limits

Enforce:

```text
max request body size
max JSON nesting depth where relevant
max array elements
max string length
max upload size
max file count
max query result size
max pagination page size
max AI input tokens
max AI output tokens
max timeout
max job runtime
```

OWASP identifies these resource boundaries as part of protection against unrestricted resource consumption. [WEB: OWASP API4:2023]

---

# 19. AI-specific guardrails

For every AI endpoint record:

```text
user_id
account_id
model
estimated cost
input tokens
output tokens
latency
success/failure
rate-limit decision
quota decision
```

Enforce:

```text
per-request token maximum
per-minute token budget
per-hour token budget
per-day token budget
per-user concurrency
global concurrency
provider budget
```

If the system supports multiple model tiers:

```text
free / cheap / standard / premium
```

assign different cost multipliers.

Do not let a trial user call the most expensive model indefinitely merely because they stay below a request-count limit.

---

# 20. Third-party provider protection

Any paid external API call must have:

```text
timeout
retry cap
backoff
circuit breaker where appropriate
per-provider concurrency
per-user quota
global budget
billing alert
```

Never retry a failed paid operation indefinitely.

OWASP specifically calls out third-party provider spending exposure as a resource-control concern. [WEB: OWASP API4:2023]

---

# 21. Logging

Every denied/throttled security-sensitive operation should create structured telemetry.

Example:

```json
{
  "event": "rate_limit_decision",
  "request_id": "...",
  "user_id": "...",
  "route": "/api/...",
  "method": "POST",
  "ip_prefix_or_hash": "...",
  "device_hash": "...",
  "decision": "THROTTLE",
  "reason_category": "VELOCITY",
  "risk_score": 67,
  "timestamp": "...",
  "latency_ms": 42
}
```

Do not log:

- passwords
- OTP values
- access tokens
- refresh tokens
- raw payment card data
- unnecessary personal data

---

# 22. Metrics

Track at minimum:

```text
rate_limit_allowed_total
rate_limit_blocked_total
rate_limit_challenged_total

signup_total
signup_denied_total
trial_granted_total
trial_denied_total

login_failed_total
login_throttled_total

otp_sent_total
otp_throttled_total

ai_requests_total
ai_requests_throttled_total
ai_usage_units_total

queue_depth
active_jobs
provider_failures

abuse_flags_total
confirmed_abuse_total
false_positive_total
```

Track by:

```text
route
decision
plan
country/region when legitimate and privacy-compliant
network category when legitimate
```

---

# 23. Alerts

Create alerts for abnormal increases in:

```text
signups/minute
signups/IP
signups/device
failed logins/minute
OTP sends
password reset requests
AI spend
AI token consumption
queue depth
provider error rate
429 rate
5xx rate
```

Do not alert on every single blocked request.

Alert on **rates and changes in baseline**.

---

# 24. Fail-open vs fail-closed

This must be an explicit design decision.

## Low-risk general API

If Redis/rate-limiter infrastructure fails:

```text
prefer controlled fail-open
+
strict edge protection
+
emergency global circuit breaker
```

Avoid taking the whole product offline because a non-critical limiter failed.

## Security-critical operations

For:

- OTP validation
- password reset
- account creation under active attack
- expensive paid-resource issuance

consider:

```text
fail-closed
```

or a reduced safe mode.

The agent must document the choice for every limiter category.

---

# 25. Do not accidentally create a self-DDoS

Bad implementation:

```text
Every request performs:
  5 Redis reads
  4 database queries
  2 external fraud API calls
  1 model call
```

before rate limiting.

Correct ordering should minimize expensive work:

```text
cheap edge checks
   ->
cheap local checks
   ->
distributed rate limit
   ->
authentication
   ->
risk checks
   ->
business logic
   ->
expensive providers
```

The exact order may differ when authentication is required to identify the user, but expensive work must not happen before basic admission control.

---

# 26. Avoid over-limiting legitimate users

Before deploying a limit:

Ask:

1. What legitimate burst does this endpoint need?
2. What shared-IP scenario could this block?
3. Can multiple users legitimately share a device/network?
4. What happens when a corporate/NAT network exceeds the IP limit?
5. What is the recovery path for false positives?
6. Does the rule punish a victim because another user on the same network abused it?

For shared environments, user/device/account dimensions should compensate for aggressive IP controls.

---

# 27. Security vs UX decision matrix

| Situation | Action |
|---|---|
| Clearly normal | Allow |
| Mildly suspicious | Allow + telemetry |
| Medium suspicion | Verification/challenge |
| High suspicion | Reduce access / quota |
| Confirmed abuse | Deny relevant benefit/resource |
| Volumetric attack | Edge throttle/block |
| Expensive-resource abuse | Usage + concurrency cap |

---

# 28. What NOT to implement

Never ship these as the main defense:

```text
âŒ One trial per IP only
âŒ One account per IP only
âŒ One account per browser cookie only
âŒ Frontend-only rate limiting
âŒ Hard-coded magic numbers in controllers
âŒ Unlimited AI usage for trial accounts
âŒ Unlimited queue creation
âŒ Unlimited retries to paid providers
âŒ Single global 100 requests/min limit for the entire API
âŒ A single IP+username login key as the only login defense
âŒ Permanent account lockout from a single abuse signal
âŒ Raw sensitive identifiers in Redis/logs
âŒ Trusting arbitrary X-Forwarded-For
âŒ Returning internal fraud/risk reasons to clients
```

---

# 29. Deep design questions the coding agent MUST answer

Before implementing, inspect the repository and answer these questions in the implementation report:

### Q1 â€” What is actually expensive?

Which operations consume the most:

- CPU?
- memory?
- database work?
- LLM tokens?
- external API money?
- queue capacity?

Do not rate-limit everything equally.

### Q2 â€” What is the real abuse objective?

Is the attacker trying to:

- farm free trials?
- steal compute?
- enumerate accounts?
- brute-force passwords?
- spam OTPs?
- scrape data?
- create referral accounts?
- exhaust quotas?

Different goals require different controls.

### Q3 â€” What identity dimensions survive account rotation?

Which of these are available and legitimate to use:

```text
account
email
phone
device
IP
ASN
payment fingerprint
behavior
historical abuse
```

Document which signals are actually implemented versus theoretical.

### Q4 â€” What happens to legitimate shared-IP users?

Test:

```text
4 family members
office NAT
university NAT
hotel Wi-Fi
mobile carrier
VPN
IPv6 privacy address rotation
```

### Q5 â€” What happens if Redis fails?

The implementation must have an explicit degraded-mode behavior.

### Q6 â€” How do we know the limits are correct?

Use:

```text
production telemetry
load tests
abuse simulations
false-positive analysis
```

Do not choose numbers because they "feel secure."

---

# 30. Required implementation workflow for the coding agent

## Phase 1 â€” Inspect before changing

Inspect:

```text
authentication
signup
trial logic
API routes
middleware
reverse proxy
deployment
Redis
database
queue
AI provider calls
payment provider
logging
monitoring
environment variables
```

Produce an architecture map before modifying code.

## Phase 2 â€” Inventory endpoints

Create a table:

```text
route
method
auth required
cost class
risk class
current limit
proposed limit
enforcement layer
```

Classify every endpoint as:

```text
PUBLIC
AUTH
SECURITY_SENSITIVE
EXPENSIVE
ADMIN
BACKGROUND
```

## Phase 3 â€” Implement infrastructure

Create reusable components:

```text
RateLimiter
TokenBucket / SlidingWindow
QuotaManager
RiskScorer
TrialEligibilityService
AbuseEventLogger
UsageMeter
ConcurrencyGuard
```

Keep policy separate from transport/controller code.

## Phase 4 â€” Apply policies

Start with:

```text
signup
login
OTP
password reset
trial activation
expensive AI endpoints
general authenticated API
```

Then cover secondary routes.

## Phase 5 â€” Add observability

Add:

```text
structured logs
metrics
dashboards/queries
alerts
request IDs
```

## Phase 6 â€” Test

Run:

```text
unit tests
integration tests
concurrency tests
load tests
abuse simulations
failure-mode tests
```

## Phase 7 â€” Verify deployment

Confirm:

```text
proxy IP handling
Redis connectivity
atomicity
horizontal scaling behavior
429 responses
Retry-After behavior
quota persistence
logging
metrics
environment configuration
```

---

# 31. Acceptance tests

The implementation is not complete until these pass.

## Rate limiting

```text
[ ] Request limit triggers at correct boundary
[ ] Burst behavior is correct
[ ] Multiple API instances share limits
[ ] Redis operations are atomic
[ ] Expired keys disappear
[ ] 429 is returned correctly
[ ] Retry-After behaves correctly where used
```

## Login

```text
[ ] Per-account failed-login limit exists
[ ] Per-IP failed-login limit exists
[ ] Credential stuffing across many users is throttled
[ ] Shared IP users are not globally locked out
```

## Signup / trial

```text
[ ] Same IP alone does not automatically deny legitimate signup
[ ] Device reuse increases risk
[ ] Trial cycling increases risk
[ ] High-risk users receive progressive friction
[ ] Trial resource limits are enforced
```

## AI / expensive operations

```text
[ ] Request count is bounded
[ ] Token/cost budget is bounded
[ ] Concurrency is bounded
[ ] Queue depth is bounded
[ ] Maximum input/output size is bounded
[ ] Provider retries are capped
```

## Failure modes

```text
[ ] Redis outage behavior is defined
[ ] Provider outage does not cause retry storms
[ ] DB outage does not create unbounded retries
[ ] Emergency global kill switch exists for critical abuse
```

---

# 32. Configuration and rollout

Never deploy new aggressive limits to 100% of traffic blindly.

Recommended rollout:

```text
Stage 1:
  shadow mode
  -> measure what WOULD have been blocked

Stage 2:
  log-only / soft enforcement

Stage 3:
  limited percentage / low-risk routes

Stage 4:
  full enforcement

Stage 5:
  tune using false positives and confirmed abuse
```

Shadow mode is particularly important for signup and login because IP/device distributions can be very different from assumptions.

---

# 33. Emergency controls

Implement configuration for emergency tightening without code deployment:

```text
GLOBAL_TRAFFIC_MULTIPLIER
SIGNUP_ENABLED
TRIAL_GRANT_ENABLED
AI_TRIAL_ENABLED
MAX_AI_COST_PER_USER
MAX_GLOBAL_AI_CONCURRENCY
EMERGENCY_ABUSE_MODE
```

Example:

```text
EMERGENCY_ABUSE_MODE=true
```

could:

```text
increase verification
reduce promotional limits
disable anonymous expensive operations
tighten signup limits
tighten AI concurrency
```

Do not expose emergency controls to ordinary application users.

---

# 34. Engineering quality rules

The coding agent must:

1. Inspect existing architecture before adding infrastructure.
2. Reuse existing Redis/auth/configuration abstractions when present.
3. Avoid duplicate rate-limit implementations.
4. Keep all thresholds configurable.
5. Add tests for every policy.
6. Avoid unrelated refactors.
7. Preserve current APIs unless a security fix requires a contract change.
8. Document any changed behavior.
9. Show exact files changed.
10. Report test evidence, not just "looks good."

When a rule conflicts with an existing architecture, explain the conflict and implement the safest compatible design rather than creating parallel systems.

---

# 35. Agent reporting format

After implementation, report exactly:

```text
## IMPLEMENTED

### 1. Architecture
- ...

### 2. Rate limits
- ...

### 3. Abuse controls
- ...

### 4. Risk scoring
- ...

### 5. Expensive-resource controls
- ...

### 6. Files changed
- ...

### 7. Configuration added
- ...

### 8. Tests run
- ...

### 9. Test results
- ...

### 10. Known limitations
- ...

### 11. Recommended next steps
- ...
```

Never report success without evidence.

---

# 36. Source and research basis

## User-provided reference

The supplied reference explains why:

- IP-only trial protection fails in shared networks.
- Device signals improve linkage but are imperfect.
- Multiple weak signals should be combined into a risk score.
- Payment signals can be strong but are not sufficient alone.
- Suspicious users should often receive progressive friction instead of immediate blocking.
- Fraud detection is probabilistic, not certain.

[USER SOURCE: attached reference]

## Current web research

### OWASP API4:2023 â€” Unrestricted Resource Consumption

OWASP recommends limiting interaction frequency, endpoint-specific operations, payload/resource size, execution/resource usage and third-party spending exposure.  
https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/

### OWASP Bot Management / Anti-Automation

OWASP recommends endpoint-specific throttling, token bucket or sliding-window approaches, and separate per-account and per-IP protections for login/credential-stuffing defense.  
https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html

### Cloudflare Rate Limiting

Cloudflare documents rate limiting for credential stuffing, bulk account creation, excessive API use and resource exhaustion, with endpoint-specific policies.  
https://developers.cloudflare.com/waf/rate-limiting-rules/

### Cloudflare Turnstile + WAF

Cloudflare documents combining network-level controls with client-side human verification; the two address different classes of automation.  
https://developers.cloudflare.com/turnstile/tutorials/integrating-turnstile-waf-and-bot-management/

### Stripe â€” Free Trial Abuse

Stripe's 2026 guidance recommends layered signals across email, device, network, payment and behavior, plus risk-based friction, rate limiting and account-level usage limits.  
https://stripe.com/resources/more/free-trial-abuse-tactics-signals-and-prevention

### RFC 6585

HTTP 429 is the standardized response for "Too Many Requests"; `Retry-After` may be used and 429 responses must not be cached.  
https://www.rfc-editor.org/info/rfc6585

---

# 37. Final rule

The system should make abuse:

```text
harder to scale
more expensive to perform
easier to detect
safer to contain
```

without turning ordinary shared networks, legitimate multi-device users, or normal bursts into false positives.

**Never optimize for the highest theoretical security number. Optimize for controlled abuse cost, low false positives, predictable resource consumption, and measurable evidence.**

