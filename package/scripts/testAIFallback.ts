import { generateContentWithFallback } from '../src/lib/utils/aiFallback';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function run() {
  console.log("Testing aiFallback centralized gateway...");
  try {
    const result = await generateContentWithFallback({
      prompt: "Reply with the exact word 'WORKING'.",
      requiredCapability: 'FAST_COPY'
    });
    console.log("Gateway Result:", result);
  } catch (error) {
    console.error("Gateway Error:", error);
  }
}

run();
