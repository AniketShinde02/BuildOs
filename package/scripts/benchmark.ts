import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables for the benchmark FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function benchmark() {
  // Dynamically import gateway AFTER env is loaded
  const { generateContent } = await import('../src/lib/ai/gateway');

  console.log("=========================================");
  console.log("   BuildOS AI Gateway Benchmark");
  console.log("=========================================\n");

  const tests = [
    { name: "FAST_TEXT (Lightweight)", capability: "FAST_TEXT" as const, prompt: "Return exactly BUILDoS_OK" },
    { name: "DESIGN_SPEC (Heavy Structured)", capability: "DESIGN_SPEC" as const, prompt: "Create a carousel showing how to start freelancing in 2026." },
  ];

  for (const test of tests) {
    console.log(`\n▶ Running ${test.name}...`);
    try {
      const result = await generateContent({
        prompt: test.prompt,
        capability: test.capability,
        structuredOutput: test.capability === 'DESIGN_SPEC'
      });

      console.log(`  └ Provider:  ${result.provider}`);
      console.log(`  └ Model:     ${result.model}`);
      console.log(`  └ Latency:   ${result.latencyMs}ms`);
      console.log(`  └ Attempts:  ${result.attempts}`);
      console.log(`  └ Status:    ${result.text ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.errorCategory) {
        console.log(`  └ Error:     ${result.errorCategory}`);
      }

    } catch (e: any) {
      console.log(`  └ CRASH:     ${e.message}`);
    }
  }
  
  console.log("\nBenchmark Complete.\n");
}

benchmark().catch(console.error);
