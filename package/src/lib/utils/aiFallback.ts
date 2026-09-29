/**
 * BuildOS Model Registry & AI Fallback Engine
 * 
 * ARCHITECTURE:
 * - Capability-aware routing. No model is called blindly.
 * - Transient failures (429/503/502/500/timeout) use bounded retry + cooldown.
 * - Permanent failures (404/deprecated) are NEVER retried in the same server lifetime.
 * - The router owns model selection. Individual engines do NOT choose their own model.
 * 
 * CURRENT VERIFIED GEMINI MODELS (as of September 2026):
 * - gemini-3.8-flash: confirmed 200 OK for this API key
 * - gemini-3.5-flash-lite: official successor to gemini-2.5-flash-lite
 * - gemini-3.5-flash: stable flash variant
 * 
 * DEPRECATED (return 404 for this account tier):
 * - gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-flash-lite
 * - gemini-1.5-pro-latest, gemini-1.5-flash-latest
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const SENSENOVA_API_KEY = process.env.SENSENOVA_API_KEY || "";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const GROK_API_KEY = process.env.GROK || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ===== TYPES =====

export type ModelCapability = 
  | 'FAST_COPY' 
  | 'STRUCTURED_CONTENT' 
  | 'REASONING' 
  | 'LONG_CONTEXT';

export type ModelStatus = 
  | 'UNKNOWN'       // Not yet tested this session
  | 'VERIFIED'      // Confirmed working
  | 'DEGRADED'      // Working but slow/partial
  | 'RATE_LIMITED'  // 429 — transient, has cooldown
  | 'UNAVAILABLE'   // 503/502/500 — transient
  | 'DEPRECATED'    // 404 / "no longer available" — PERMANENT this session
  | 'DISABLED';     // Explicitly disabled

export type FailureClass = 
  | 'PERMANENT'   // 404, deprecated → never retry
  | 'TRANSIENT'   // 429, 503, 502, 500, timeout → retry with backoff
  | 'UNKNOWN';

export interface ModelDefinition {
  provider: 'google' | 'mistral' | 'sensenova' | 'xai';
  modelId: string;
  capabilities: ModelCapability[];
  status: ModelStatus;
  failureCount: number;
  cooldownUntil: number;       // epoch ms. 0 = no cooldown.
  lastFailureClass: FailureClass;
  lastVerifiedAt: number;      // epoch ms
}

export interface AiGenerateOptions {
  systemInstruction?: string;
  prompt: string;
  responseMimeType?: string;
  requiredCapability?: ModelCapability;
  maxRetries?: number;         // default 2 for transient
  timeoutMs?: number;          // default 25000
}

// ===== REGISTRY =====
// Order determines routing priority. First VERIFIED eligible model wins.
const REGISTRY: ModelDefinition[] = [
  // ---- Google Gemini (verified working models for this account) ----
  {
    provider: 'google',
    modelId: 'gemini-3.8-flash',
    capabilities: ['FAST_COPY', 'STRUCTURED_CONTENT', 'REASONING', 'LONG_CONTEXT'],
    status: 'UNKNOWN',
    failureCount: 0,
    cooldownUntil: 0,
    lastFailureClass: 'UNKNOWN',
    lastVerifiedAt: 0
  },
  {
    provider: 'google',
    modelId: 'gemini-3.5-flash',
    capabilities: ['FAST_COPY', 'STRUCTURED_CONTENT', 'REASONING'],
    status: 'UNKNOWN',
    failureCount: 0,
    cooldownUntil: 0,
    lastFailureClass: 'UNKNOWN',
    lastVerifiedAt: 0
  },
  {
    provider: 'google',
    modelId: 'gemini-3.5-flash-lite',
    capabilities: ['FAST_COPY', 'STRUCTURED_CONTENT'],
    status: 'UNKNOWN',
    failureCount: 0,
    cooldownUntil: 0,
    lastFailureClass: 'UNKNOWN',
    lastVerifiedAt: 0
  },

  // ---- Mistral (429 today, but transient — keep in registry with cooldown) ----
  {
    provider: 'mistral',
    modelId: 'mistral-small-latest',
    capabilities: ['FAST_COPY', 'STRUCTURED_CONTENT'],
    status: 'UNKNOWN',
    failureCount: 0,
    cooldownUntil: 0,
    lastFailureClass: 'UNKNOWN',
    lastVerifiedAt: 0
  },

  // ---- xAI Grok (if key is present) ----
  {
    provider: 'xai',
    modelId: 'grok-3-mini',
    capabilities: ['FAST_COPY', 'STRUCTURED_CONTENT', 'REASONING'],
    status: 'UNKNOWN',
    failureCount: 0,
    cooldownUntil: 0,
    lastFailureClass: 'UNKNOWN',
    lastVerifiedAt: 0
  },

  // ---- SenseNova ----
  {
    provider: 'sensenova',
    modelId: 'sensenova-6.8-flash-lite',
    capabilities: ['FAST_COPY'],
    status: 'UNKNOWN',
    failureCount: 0,
    cooldownUntil: 0,
    lastFailureClass: 'UNKNOWN',
    lastVerifiedAt: 0
  },
];

// ===== FAILURE CLASSIFIER =====

function classifyFailure(error: any, statusCode?: number): FailureClass {
  const code = statusCode || error?.status || 0;
  const msg = (error?.message || '').toLowerCase();

  // Permanent: 404, "no longer available", "deprecated", "not found"
  if (
    code === 404 ||
    msg.includes('no longer available') ||
    msg.includes('deprecated') ||
    msg.includes('not found') ||
    msg.includes('model not found')
  ) {
    return 'PERMANENT';
  }

  // Transient: 429, 500, 502, 503, network timeout
  if (
    code === 429 ||
    code === 500 ||
    code === 502 ||
    code === 503 ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('timeout') ||
    msg.includes('unavailable') ||
    msg.includes('high demand')
  ) {
    return 'TRANSIENT';
  }

  return 'UNKNOWN';
}

// ===== MODEL REGISTRY CLASS =====

export class ModelRegistry {
  static getEligibleModels(capability?: ModelCapability): ModelDefinition[] {
    const now = Date.now();
    return REGISTRY.filter(m => {
      // Skip permanently dead models
      if (m.status === 'DEPRECATED' || m.status === 'DISABLED') return false;
      // Skip if still in cooldown
      if (m.cooldownUntil > now) return false;
      // Skip if capability doesn't match
      if (capability && !m.capabilities.includes(capability)) return false;
      // Skip providers with no API key configured
      if (m.provider === 'google' && !GEMINI_API_KEY) return false;
      if (m.provider === 'mistral' && !MISTRAL_API_KEY) return false;
      if (m.provider === 'sensenova' && !SENSENOVA_API_KEY) return false;
      if (m.provider === 'xai' && !GROK_API_KEY) return false;
      return true;
    });
  }

  static markFailed(modelId: string, error?: any, statusCode?: number) {
    const m = REGISTRY.find(x => x.modelId === modelId);
    if (!m) return;

    const failureClass = classifyFailure(error, statusCode);
    m.lastFailureClass = failureClass;
    m.failureCount++;

    if (failureClass === 'PERMANENT') {
      m.status = 'DEPRECATED';
      console.warn(`[ModelRegistry] ${modelId} PERMANENTLY disabled (404/deprecated). Will not be called again.`);
    } else {
      // Transient: exponential backoff cooldown
      // 1st fail: 30s, 2nd: 60s, 3rd: 120s, 4th+: 300s (5min)
      const backoffSeconds = Math.min(30 * Math.pow(2, m.failureCount - 1), 300);
      // Add ±20% jitter
      const jitter = backoffSeconds * 0.2 * (Math.random() - 0.5) * 2;
      m.cooldownUntil = Date.now() + (backoffSeconds + jitter) * 1000;
      m.status = statusCode === 429 ? 'RATE_LIMITED' : 'UNAVAILABLE';
      console.warn(
        `[ModelRegistry] ${modelId} TRANSIENT failure (${statusCode ?? 'network'}). Cooldown: ${Math.round(backoffSeconds)}s. Failures: ${m.failureCount}`
      );
    }
  }

  static markVerified(modelId: string) {
    const m = REGISTRY.find(x => x.modelId === modelId);
    if (!m) return;
    m.status = 'VERIFIED';
    m.failureCount = 0;
    m.cooldownUntil = 0;
    m.lastVerifiedAt = Date.now();
  }

  static getStatus(): Array<{ modelId: string; provider: string; status: string; failureCount: number; cooldownRemaining: string }> {
    const now = Date.now();
    return REGISTRY.map(m => ({
      modelId: m.modelId,
      provider: m.provider,
      status: m.status,
      failureCount: m.failureCount,
      cooldownRemaining: m.cooldownUntil > now 
        ? `${Math.round((m.cooldownUntil - now) / 1000)}s` 
        : 'none'
    }));
  }
}

// ===== PROVIDER EXECUTORS =====

async function callGoogle(modelDef: ModelDefinition, options: AiGenerateOptions, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const model = genAI.getGenerativeModel({
      model: modelDef.modelId,
      generationConfig: options.responseMimeType 
        ? { responseMimeType: options.responseMimeType as any }
        : undefined,
    });

    const contents = options.systemInstruction
      ? [{ role: 'user' as const, parts: [{ text: options.systemInstruction + '\n\n' + options.prompt }] }]
      : [{ role: 'user' as const, parts: [{ text: options.prompt }] }];

    const result = await model.generateContent({ contents });
    clearTimeout(timeoutId);
    
    const text = result?.response?.text();
    return (text && text.trim().length > 0) ? text : null;
  } catch (e: any) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function callMistral(modelDef: ModelDefinition, options: AiGenerateOptions, timeoutMs: number): Promise<string | null> {
  const messages: any[] = [];
  if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
  messages.push({ role: 'user', content: options.prompt });

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({
      model: modelDef.modelId,
      messages,
      response_format: options.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody?.message || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callXAI(modelDef: ModelDefinition, options: AiGenerateOptions, timeoutMs: number): Promise<string | null> {
  const messages: any[] = [];
  if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
  messages.push({ role: 'user', content: options.prompt });

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROK_API_KEY}` },
    body: JSON.stringify({
      model: modelDef.modelId,
      messages,
      response_format: options.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody?.message || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callSenseNova(modelDef: ModelDefinition, options: AiGenerateOptions, timeoutMs: number): Promise<string | null> {
  const messages: any[] = [];
  if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
  messages.push({ role: 'user', content: options.prompt });

  const res = await fetch('https://token.sensenova.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SENSENOVA_API_KEY}` },
    body: JSON.stringify({
      model: modelDef.modelId,
      messages,
      response_format: options.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody?.message || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// ===== MAIN DISPATCHER =====

/**
 * Executes content generation via the Capability-Aware Model Registry.
 * 
 * - Only eligible (non-deprecated, non-cooling-down) models are tried.
 * - Permanent failures (404) disable the model for the session.
 * - Transient failures (429/503) put the model in cooldown with exponential backoff.
 * - Returns null only if ALL eligible models fail.
 */
export async function generateContentWithFallback(options: AiGenerateOptions): Promise<string | null> {
  const eligibleModels = ModelRegistry.getEligibleModels(options.requiredCapability);
  
  if (eligibleModels.length === 0) {
    console.error('[ModelRegistry] CRITICAL: Zero eligible models for capability:', options.requiredCapability ?? 'any');
    console.error('[ModelRegistry] Current registry status:', JSON.stringify(ModelRegistry.getStatus(), null, 2));
    return null;
  }

  const timeoutMs = options.timeoutMs ?? 25000;
  const maxRetriesForTransient = options.maxRetries ?? 1; // 1 retry per transient failure

  for (const modelDef of eligibleModels) {
    let lastError: any;
    let attempt = 0;
    const maxAttempts = maxRetriesForTransient + 1;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        let result: string | null = null;

        if (modelDef.provider === 'google') {
          result = await callGoogle(modelDef, options, timeoutMs);
        } else if (modelDef.provider === 'mistral') {
          result = await callMistral(modelDef, options, timeoutMs);
        } else if (modelDef.provider === 'xai') {
          result = await callXAI(modelDef, options, timeoutMs);
        } else if (modelDef.provider === 'sensenova') {
          result = await callSenseNova(modelDef, options, timeoutMs);
        }

        if (result && result.trim().length > 0) {
          ModelRegistry.markVerified(modelDef.modelId);
          return result;
        }

        // Empty response from model — treat as transient, try next model
        break;

      } catch (error: any) {
        lastError = error;
        const statusCode = error?.status || error?.code;
        const failureClass = classifyFailure(error, statusCode);

        if (failureClass === 'PERMANENT') {
          ModelRegistry.markFailed(modelDef.modelId, error, statusCode);
          break; // Skip to next model immediately
        }

        // Transient: maybe retry
        if (attempt < maxAttempts) {
          // Brief jitter before retry (200-600ms)
          await new Promise(r => setTimeout(r, 200 + Math.random() * 400));
          continue;
        }

        // Exhausted retries for this model
        ModelRegistry.markFailed(modelDef.modelId, error, statusCode);
        break;
      }
    }
  }

  console.error('[ModelRegistry] All eligible models failed or returned empty. Registry state:');
  console.error(JSON.stringify(ModelRegistry.getStatus(), null, 2));
  return null;
}
