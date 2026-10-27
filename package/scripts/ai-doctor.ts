import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables for the benchmark FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runDoctor() {
  const { HealthManager, ProviderType, classifyError } = await import('../src/lib/ai/gateway');

  console.log("=========================================");
  console.log("           BUILDoS AI DOCTOR");
  console.log("=========================================\n");

  console.log("Environment");
  console.log("-----------");
  const providers = ['OPENROUTER', 'GROQ', 'MISTRAL', 'SAMBANOVA', 'GEMINI', 'SENSENOVA'];
  for (const provider of providers) {
    const key = process.env[`${provider}_API_KEY`];
    console.log(`${provider.padEnd(14)} ${key ? 'configured' : 'disabled'}`);
  }
  console.log("\nFAST_TEXT");
  console.log("---------");
  console.log(`Candidate`.padEnd(33) + `Status`);

  const deployments = HealthManager.getStatus().deployments;
  let fastTextReady = false;

  for (const dep of deployments) {
    if (!dep.capabilities.includes('FAST_TEXT')) continue;
    
    let status = 'TESTING';
    let latency = 0;
    
    const startTime = Date.now();
    try {
      // Direct fetch to verify
      const apiKey = process.env[`${dep.provider.toUpperCase()}_API_KEY`] || '';
      if (!apiKey) {
         console.log(`${dep.id}/${dep.modelId}`.padEnd(33) + `DISABLED (No API Key)`);
         continue;
      }

      const endpoints: Record<string, string> = {
        groq: 'https://api.groq.com/openai/v1/chat/completions',
        mistral: 'https://api.mistral.ai/v1/chat/completions',
        sambanova: 'https://api.sambanova.ai/v1/chat/completions',
        openrouter: 'https://openrouter.ai/api/v1/chat/completions',
        sensenova: 'https://api.sensenova.cn/v1/chat/completions',
      };

      const res = await fetch(endpoints[dep.provider], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: dep.modelId,
          messages: [{ role: 'user', content: 'Return exactly BUILDoS_OK' }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        status = classifyError({ status: res.status });
      } else {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        latency = Date.now() - startTime;
        if (content && content.includes('BUILDoS_OK')) {
          status = `PASS (${latency}ms)`;
          fastTextReady = true;
        } else {
           status = 'FAIL (Bad Output)';
        }
      }
    } catch (err: any) {
       status = classifyError(err);
    }
    
    console.log(`${dep.id}/${dep.modelId}`.padEnd(33) + status);
  }

  console.log("\nRESULT: ");
  console.log(`FAST_TEXT = ${fastTextReady ? 'READY' : 'NO HEALTHY DEPLOYMENT'}`);
  
  if (fastTextReady) {
     console.log("\nLive Model Catalog (OpenRouter) test:");
     if (process.env.OPENROUTER_API_KEY) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models', {
             headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
          });
          if (res.ok) {
             const data = await res.json();
             console.log(`Successfully fetched ${data.data?.length} models from OpenRouter catalog.`);
             const nitro = data.data?.filter((m: any) => m.id.includes(':nitro'));
             console.log(`Found ${nitro.length} :nitro optimized models.`);
          }
        } catch(e) {
          console.log('Failed to fetch OpenRouter models.');
        }
     }
  }
}

runDoctor().catch(console.error);
