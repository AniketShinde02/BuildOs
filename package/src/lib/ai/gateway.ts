/// <reference types="node" />

/**
 * BuildOS AI Control Plane
 * 
 * ARCHITECTURE (Rules #1-#55):
 * - ONE provider registry. Feature code never instantiates providers directly.
 * - Providers = Groq, Mistral, SambaNova. Gemini REMOVED from content generation.
 * - Model IDs sourced exclusively from environment variables.
 * - Capability-aware routing with bounded retry and cooldown.
 * - Fail-closed: null means failure. No fallback creative content.
 */

// ===== TYPES =====

export type ProviderType = 'groq' | 'mistral' | 'sambanova' | 'xai' | 'openrouter' | 'sensenova';

export type ModelCapability =
  | 'FAST_TEXT'
  | 'CONTENT_ENHANCEMENT'
  | 'POST_GENERATION'
  | 'CAROUSEL_PLANNING'
  | 'CAROUSEL_GENERATION'
  | 'DESIGN_SPEC'
  | 'SEMANTIC_VALIDATION'
  | 'STRUCTURED_CONTENT';

export type ModelHealthState =
  | 'HEALTHY'    // Working normally
  | 'DEGRADED'   // Working but slow
  | 'COOLDOWN'   // Temporarily unavailable (429/5xx) — TRANSIENT
  | 'INVALID'    // Bad config/model not found — CONFIG_ERROR
  | 'DISABLED';  // Explicitly disabled in config

export type ErrorCategory =
  | 'RATE_LIMITED'     // 429
  | 'TRANSIENT'        // 500/502/503/504/network
  | 'REQUEST_ERROR'    // 400
  | 'AUTH_ERROR'       // 401
  | 'AUTHORIZATION_ERROR' // 403
  | 'MODEL_NOT_FOUND'  // 404
  | 'OUTPUT_ERROR'     // Malformed response
  | 'VALIDATION_ERROR' // Schema failure
  | 'TIMEOUT'          // AbortError
  | 'UNKNOWN';

export interface ModelDeployment {
  id: string;
  provider: ProviderType;
  modelId: string;
  capabilities: ModelCapability[];
  supportsStructuredOutput: boolean;
  enabled: boolean;
  health: ModelHealthState;
  cooldownUntil: number;       // epoch ms. 0 = no cooldown.
  failureCount: number;
  lastErrorCategory: ErrorCategory;
  lastVerifiedAt: number;
  lastFailedAt: number;
  lastLatencyMs: number;
}

export interface AIGenerateOptions {
  systemInstruction?: string;
  prompt: string;
  capability: ModelCapability;
  structuredOutput?: boolean;   // request JSON mode
  maxTotalAttempts?: number;    // default 3 across all providers
  totalTimeoutMs?: number;      // hard wall clock limit
  traceId?: string;
  perCallTimeoutMs?: number;
}

const CAPABILITY_TIMEOUTS: Record<ModelCapability, number> = {
  FAST_TEXT: 4000,
  CONTENT_ENHANCEMENT: 20000,
  POST_GENERATION: 20000,
  CAROUSEL_PLANNING: 25000,
  CAROUSEL_GENERATION: 20000,
  DESIGN_SPEC: 25000,
  SEMANTIC_VALIDATION: 10000,
  STRUCTURED_CONTENT: 25000
};

export interface AIGenerateResult {
  text: string | null;
  traceId: string;
  provider: string;
  model: string;
  latencyMs: number;
  attempts: number;
  errorCategory?: ErrorCategory;
}

// ===== API KEY REGISTRY =====
// Only read from env. Never hardcoded.

const PROVIDER_KEYS: Record<ProviderType, () => string> = {
  groq: () => process.env.GROQ_API_KEY || process.env.GROK || '',
  mistral: () => process.env.MISTRAL_API_KEY || '',
  sambanova: () => process.env.SAMBANOVA_API_KEY || '',
  xai: () => process.env.XAI_API_KEY || '',
  openrouter: () => process.env.OPENROUTER_API_KEY || '',
  sensenova: () => process.env.SENSENOVA_API_KEY || '',
};

const PROVIDER_ENDPOINTS: Record<ProviderType, string> = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  sambanova: 'https://api.sambanova.ai/v1/chat/completions',
  xai: 'https://api.x.ai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  sensenova: 'https://api.sensenova.cn/v1/chat/completions',
};

// ===== DEPLOYMENT REGISTRY =====
// Built dynamically from environment variables. No hardcoded model IDs.

const DEPLOYMENTS: ModelDeployment[] = [];

function registerDeployment(
  id: string,
  providerEnvKey: string,
  modelEnvKey: string,
  defaultProvider: ProviderType,
  defaultModel: string,
  capabilities: ModelCapability[],
  supportsStructuredOutput = true
) {
  const provider = (process.env[providerEnvKey] as ProviderType) || defaultProvider;
  const modelId = process.env[modelEnvKey] || defaultModel;

  // Only register if provider has an API key configured
  const apiKey = PROVIDER_KEYS[provider]?.();
  if (!apiKey) {
    return; // Provider not configured — skip silently
  }

  DEPLOYMENTS.push({
    id,
    provider,
    modelId,
    capabilities,
    supportsStructuredOutput,
    enabled: true,
    health: 'HEALTHY',
    cooldownUntil: 0,
    failureCount: 0,
    lastErrorCategory: 'UNKNOWN',
    lastVerifiedAt: 0,
    lastFailedAt: 0,
    lastLatencyMs: 0,
  });
}

// PRIMARY: Fast text & structured content (Groq)
registerDeployment(
  'primary',
  'AI_PROVIDER_PRIMARY',
  'AI_MODEL_PRIMARY',
  'openrouter',
  'meta-llama/llama-3.3-70b-instruct',
  ['FAST_TEXT', 'CONTENT_ENHANCEMENT', 'POST_GENERATION', 'CAROUSEL_GENERATION', 'CAROUSEL_PLANNING', 'DESIGN_SPEC', 'STRUCTURED_CONTENT']
);

// STRUCTURED: Strict JSON output (Groq)
registerDeployment(
  'structured',
  'AI_PROVIDER_STRUCTURED',
  'AI_MODEL_STRUCTURED',
  'openrouter',
  'meta-llama/llama-3.3-70b-instruct',
  ['STRUCTURED_CONTENT', 'CAROUSEL_GENERATION', 'CAROUSEL_PLANNING', 'DESIGN_SPEC'],
  true
);

// FAST: Lightweight copy tasks (Groq)
registerDeployment(
  'fast',
  'AI_PROVIDER_FAST',
  'AI_MODEL_FAST',
  'openrouter',
  'google/gemini-2.5-flash',
  ['FAST_TEXT', 'CONTENT_ENHANCEMENT'],
  true
);

// SECONDARY: Mistral fallback
registerDeployment(
  'secondary',
  'AI_PROVIDER_SECONDARY',
  'AI_MODEL_SECONDARY',
  'mistral',
  'mistral-small-latest',
  ['FAST_TEXT', 'CONTENT_ENHANCEMENT', 'POST_GENERATION', 'STRUCTURED_CONTENT'],
  true
);

// REASONING: SambaNova for heavy reasoning
registerDeployment(
  'reasoning',
  'AI_PROVIDER_REASONING',
  'AI_MODEL_REASONING',
  'sambanova',
  'Meta-Llama-3.3-70B-Instruct',
  ['SEMANTIC_VALIDATION', 'POST_GENERATION', 'STRUCTURED_CONTENT'],
  true
);

// Capability-specific content deployments
registerDeployment(
  'content',
  'AI_CONTENT_PROVIDER',
  'AI_MODEL_CONTENT',
  'openrouter',
  'meta-llama/llama-3.3-70b-instruct',
  ['POST_GENERATION', 'CONTENT_ENHANCEMENT']
);

registerDeployment(
  'carousel',
  'AI_CAROUSEL_PROVIDER',
  'AI_MODEL_CAROUSEL',
  'openrouter',
  'google/gemini-2.5-flash',
  ['CAROUSEL_GENERATION', 'CAROUSEL_PLANNING']
);

registerDeployment(
  'validation',
  'AI_VALIDATION_PROVIDER',
  'AI_MODEL_VALIDATION',
  'mistral',
  'mistral-small-latest',
  ['SEMANTIC_VALIDATION']
);

// SENSENOVA: Extra Fallback
registerDeployment(
  'sensenova_fallback',
  'AI_PROVIDER_SENSENOVA',
  'AI_MODEL_SENSENOVA',
  'sensenova',
  'SenseChat-5',
  ['FAST_TEXT', 'CONTENT_ENHANCEMENT', 'POST_GENERATION', 'STRUCTURED_CONTENT', 'SEMANTIC_VALIDATION'],
  true
);

// EMERGENCY FALLBACK (Configurable)
if (process.env.AI_OPENROUTER_EMERGENCY_ENABLED === 'true') {
  registerDeployment(
    'emergency_router',
    'AI_PROVIDER_EMERGENCY',
    'AI_OPENROUTER_EMERGENCY_MODEL',
    'openrouter',
    'openrouter/free',
    ['FAST_TEXT', 'CONTENT_ENHANCEMENT', 'POST_GENERATION', 'STRUCTURED_CONTENT', 'SEMANTIC_VALIDATION', 'CAROUSEL_PLANNING', 'CAROUSEL_GENERATION', 'DESIGN_SPEC'],
    true
  );
}

// ===== ERROR CLASSIFIER =====

export function classifyError(error: any, statusCode?: number): ErrorCategory {
  const code = statusCode ?? error?.status ?? 0;
  const msg = String(error?.message || '').toLowerCase();

  if (code === 429 || msg.includes('rate limit') || msg.includes('quota exceeded')) return 'RATE_LIMITED';
  if (code === 401) return 'AUTH_ERROR';
  if (code === 403) return 'AUTHORIZATION_ERROR';
  if (code === 404 || msg.includes('model not found') || msg.includes('not found')) return 'MODEL_NOT_FOUND';
  if (code === 400) return 'REQUEST_ERROR';
  if (msg.includes('abort') || msg.includes('timeout') || error?.name === 'AbortError') return 'TIMEOUT';
  if (code === 500 || code === 502 || code === 503 || code === 504 || msg.includes('unavailable') || msg.includes('high demand')) return 'TRANSIENT';

  return 'UNKNOWN';
}

function isTransient(category: ErrorCategory): boolean {
  return ['RATE_LIMITED', 'TRANSIENT', 'TIMEOUT'].includes(category);
}

function isPermanent(category: ErrorCategory): boolean {
  return ['MODEL_NOT_FOUND', 'AUTH_ERROR'].includes(category);
}

// ===== HEALTH MANAGER =====

export class HealthManager {
  static markFailure(deployment: ModelDeployment, error: any, statusCode?: number) {
    const category = classifyError(error, statusCode);
    deployment.lastErrorCategory = category;
    deployment.failureCount++;
    deployment.lastFailedAt = Date.now();

    if (isPermanent(category)) {
      deployment.health = 'INVALID';
      deployment.enabled = false;
      console.warn(`[AIGateway] ${deployment.id}(${deployment.modelId}) PERMANENT failure [${category}]. Disabled.`);
    } else if (category === 'TIMEOUT') {
      if (deployment.failureCount === 1) {
        deployment.health = 'DEGRADED';
        deployment.cooldownUntil = 0;
        console.warn(`[AIGateway] ${deployment.id}(${deployment.modelId}) TRANSIENT [${category}]. Health: DEGRADED. No cooldown yet.`);
      } else {
        const backoffSec = Math.min(10 * Math.pow(2, deployment.failureCount - 2), 300);
        const jitterSec = backoffSec * 0.2 * (Math.random() - 0.5) * 2;
        deployment.cooldownUntil = Date.now() + (backoffSec + jitterSec) * 1000;
        deployment.health = 'COOLDOWN';
        console.warn(`[AIGateway] ${deployment.id}(${deployment.modelId}) TRANSIENT [${category}]. Cooldown: ${Math.round(backoffSec)}s. Failures: ${deployment.failureCount}`);
      }
    } else if (isTransient(category)) {
      // Exponential backoff: 30s → 60s → 120s → 300s (5min max)
      const backoffSec = Math.min(30 * Math.pow(2, deployment.failureCount - 1), 300);
      const jitterSec = backoffSec * 0.2 * (Math.random() - 0.5) * 2;
      deployment.cooldownUntil = Date.now() + (backoffSec + jitterSec) * 1000;
      deployment.health = 'COOLDOWN';
      console.warn(`[AIGateway] ${deployment.id}(${deployment.modelId}) TRANSIENT [${category}]. Cooldown: ${Math.round(backoffSec)}s. Failures: ${deployment.failureCount}`);
    }
  }

  static markSuccess(deployment: ModelDeployment, latencyMs: number) {
    deployment.health = 'HEALTHY';
    deployment.failureCount = 0;
    deployment.cooldownUntil = 0;
    deployment.lastVerifiedAt = Date.now();
    deployment.lastLatencyMs = latencyMs;
  }

  static async probeDeployment(deployment: ModelDeployment): Promise<boolean> {
    const now = Date.now();
    // Cache TTL: 60s
    if (deployment.health === 'HEALTHY' && now - deployment.lastVerifiedAt < 60000) {
      return true;
    }

    try {
      const apiKey = PROVIDER_KEYS[deployment.provider]();
      if (!apiKey) return false;

      const endpoint = PROVIDER_ENDPOINTS[deployment.provider];
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: deployment.modelId,
          messages: [{ role: 'user', content: 'Return exactly BUILDoS_OK' }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(3000), // very low timeout for probe
      });

      if (!res.ok) {
        this.markFailure(deployment, { status: res.status });
        return false;
      }
      
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && content.includes('BUILDoS_OK')) {
        this.markSuccess(deployment, 0); // Need latency
        return true;
      }
      return false;
    } catch (err: any) {
      this.markFailure(deployment, err);
      return false;
    }
  }

  static getEligible(capability: ModelCapability): ModelDeployment[] {
    const now = Date.now();
    // Deduplicate by provider+model to avoid calling same model twice
    const seen = new Set<string>();
    return DEPLOYMENTS.filter(d => {
      if (!d.enabled) return false;
      if (d.health === 'INVALID' || d.health === 'DISABLED') return false;
      if (d.cooldownUntil > now) return false;
      if (!d.capabilities.includes(capability)) return false;

      const key = `${d.provider}:${d.modelId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static getStatus(): Record<string, any> {
    const now = Date.now();
    const eligible = DEPLOYMENTS.filter(d => d.enabled && d.cooldownUntil <= now && d.health !== 'INVALID');
    
    return {
      totalDeployments: DEPLOYMENTS.length,
      healthyDeployments: eligible.length,
      deployments: DEPLOYMENTS.map(d => ({
        id: d.id,
        provider: d.provider,
        modelId: d.modelId,
        health: d.health,
        capabilities: d.capabilities,
        failureCount: d.failureCount,
        cooldownRemaining: d.cooldownUntil > now ? `${Math.round((d.cooldownUntil - now) / 1000)}s` : 'none',
        lastLatencyMs: d.lastLatencyMs,
      }))
    };
  }
}

// ===== PROVIDER EXECUTOR =====

async function executeProviderCall(
  deployment: ModelDeployment,
  options: AIGenerateOptions,
  timeoutMs: number
): Promise<string | null> {
  const apiKey = PROVIDER_KEYS[deployment.provider]();
  if (!apiKey) {
    throw Object.assign(new Error(`No API key for provider ${deployment.provider}`), { status: 401 });
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: options.prompt });

  const body: any = {
    model: deployment.modelId,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  };

  if (options.structuredOutput && deployment.supportsStructuredOutput) {
    body.response_format = { type: 'json_object' };
  }

  const endpoint = PROVIDER_ENDPOINTS[deployment.provider];
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const errMsg = errBody?.error?.message || errBody?.message || `HTTP ${res.status}`;
    const err = Object.assign(new Error(errMsg), { status: res.status });
    throw err;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return content && content.trim().length > 0 ? content : null;
}

// ===== MAIN AI GATEWAY =====

/**
 * The ONE entry point for ALL AI content generation in BuildOS.
 * 
 * Returns AIGenerateResult where text=null means ALL providers failed.
 * NEVER returns fallback/demo content on failure.
 * Callers MUST check result.text !== null before proceeding.
 */
export async function generateContent(options: AIGenerateOptions): Promise<AIGenerateResult> {
  const traceId = options.traceId || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const maxAttempts = options.maxTotalAttempts ?? 3;
  const totalTimeout = options.totalTimeoutMs ?? 30000;
  
  const capTimeout = CAPABILITY_TIMEOUTS[options.capability] || 10000;
  const perCallTimeout = options.perCallTimeoutMs ?? capTimeout;

  const eligibleDeployments = HealthManager.getEligible(options.capability);

  if (eligibleDeployments.length === 0) {
    console.error(`[AIGateway] trace=${traceId} capability=${options.capability} ZERO eligible deployments.`);
    console.error('[AIGateway] Registry status:', JSON.stringify(HealthManager.getStatus(), null, 2));
    return { text: null, traceId, provider: 'none', model: 'none', latencyMs: 0, attempts: 0, errorCategory: 'UNKNOWN' };
  }

  const startWall = Date.now();
  let totalAttempts = 0;
  let lastErrorCategory: ErrorCategory = 'UNKNOWN';

  for (const deployment of eligibleDeployments) {
    if (totalAttempts >= maxAttempts) break;
    if (Date.now() - startWall >= totalTimeout) {
      console.warn(`[AIGateway] trace=${traceId} wall clock limit hit after ${totalAttempts} attempts.`);
      break;
    }

    totalAttempts++;
    const attemptStart = Date.now();

    // PROBE BEFORE USING
    const isHealthy = await HealthManager.probeDeployment(deployment);
    if (!isHealthy) {
       console.warn(`[AIGateway] trace=${traceId} provider=${deployment.provider} model=${deployment.modelId} FAILED PROBE. Skipping.`);
       continue;
    }

    try {
      console.log(`[AIGateway] trace=${traceId} feature=${options.capability} provider=${deployment.provider} model=${deployment.modelId} attempt=${totalAttempts}`);

      const text = await executeProviderCall(deployment, options, perCallTimeout);
      const latencyMs = Date.now() - attemptStart;

      if (text) {
        HealthManager.markSuccess(deployment, latencyMs);
        console.log(`[AIGateway] trace=${traceId} provider=${deployment.provider} model=${deployment.modelId} attempt=${totalAttempts} duration=${latencyMs}ms status=success`);
        return { text, traceId, provider: deployment.provider, model: deployment.modelId, latencyMs, attempts: totalAttempts };
      }

      // Empty response: treat as transient, try next
      console.warn(`[AIGateway] trace=${traceId} provider=${deployment.provider} returned empty content.`);
      lastErrorCategory = 'OUTPUT_ERROR';

    } catch (error: any) {
      const latencyMs = Date.now() - attemptStart;
      const category = classifyError(error, error?.status);
      lastErrorCategory = category;

      console.warn(`[AIGateway] trace=${traceId} capability=${options.capability} provider=${deployment.provider} model=${deployment.modelId} attempt=${totalAttempts} duration=${latencyMs}ms timeoutMs=${perCallTimeout}ms abortTriggered=${category === 'TIMEOUT'} upstreamStatus=${error?.status || 'N/A'} category=${category}`);

      HealthManager.markFailure(deployment, error, error?.status);

      // Permanent failures: move on immediately to next deployment
      // Transient failures: also move on (bounded by maxAttempts and wall clock)
    }
  }

  console.error(`[AIGateway] trace=${traceId} ALL deployments failed for capability=${options.capability} after ${totalAttempts} attempts.`);
  return { text: null, traceId, provider: 'none', model: 'none', latencyMs: Date.now() - startWall, attempts: totalAttempts, errorCategory: lastErrorCategory };
}

// ===== HEALTH DIAGNOSTIC ENDPOINT DATA =====

export function getHealthStatus() {
  return HealthManager.getStatus();
}

// ===== LEGACY COMPATIBILITY SHIM =====
// Existing routes that called generateContentWithFallback() still work.
// They get null on failure — which is correct fail-closed behavior.

export type { AIGenerateOptions as AiGenerateOptions };
export type { ModelCapability as ModelCapabilityType };

export async function generateContentWithFallback(options: {
  systemInstruction?: string;
  prompt: string;
  responseMimeType?: string;
  requiredCapability?: string;
  maxRetries?: number;
  timeoutMs?: number;
}): Promise<string | null> {
  const capabilityMap: Record<string, ModelCapability> = {
    'FAST_COPY': 'FAST_TEXT',
    'STRUCTURED_CONTENT': 'STRUCTURED_CONTENT',
    'REASONING': 'SEMANTIC_VALIDATION',
    'LONG_CONTEXT': 'POST_GENERATION',
  };

  const capability: ModelCapability = capabilityMap[options.requiredCapability ?? ''] ?? 'FAST_TEXT';

  const result = await generateContent({
    systemInstruction: options.systemInstruction,
    prompt: options.prompt,
    capability,
    structuredOutput: options.responseMimeType === 'application/json',
    totalTimeoutMs: options.timeoutMs ?? 20000,
  });

  return result.text;
}
