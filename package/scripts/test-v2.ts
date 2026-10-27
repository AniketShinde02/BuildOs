import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testV2Engine() {
  const { ContentOperatingSystem } = await import('../src/lib/studio/engine/v2/ContentOperatingSystem');
  
  console.log("Submitting job to V2 Content OS...");
  const jobId = await ContentOperatingSystem.submitIntake(
    "How to start freelancing as a software engineer in 2026. Give me a step by step guide."
  );
  
  console.log(`Job created: ${jobId}`);

  // Poll until ready or failed
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const job = ContentOperatingSystem.getJob(jobId);
      if (!job) return;
      
      console.log(`[Status]: ${job.status}`);
      if (job.status === 'READY') {
        clearInterval(interval);
        console.log("\nSuccess! V2 Pipeline Complete.");
        console.log(`Brief Topic: ${job.brief?.topic}`);
        console.log(`Slides generated: ${job.carousel?.slides?.length}`);
        console.log(`Layout Family: ${job.designSpec?.spec?.layoutFamily}`);
        resolve(true);
      } else if (job.status === 'FAILED') {
        clearInterval(interval);
        console.error("\nPipeline Failed:", job.error);
        resolve(false);
      }
    }, 2000);
  });
}

testV2Engine().catch(console.error);
