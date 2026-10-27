'use server';

import { ContentOperatingSystem } from '../engine/v2/ContentOperatingSystem';
import { DesignSpecification } from '../models/DesignSpecification';

/**
 * Server action to execute the 11-engine AI Creative Operating System safely on the server.
 * Proxies the V2 pipeline synchronously to satisfy the V1 frontend expectations.
 */
export async function submitCreativeJobAction(prompt: string): Promise<string> {
  return await ContentOperatingSystem.submitIntake(prompt);
}

export async function generateCreativeSpecAction(prompt: string, _platform: string = 'linkedin'): Promise<DesignSpecification> {
  const jobId = await ContentOperatingSystem.submitIntake(prompt);
  
  return new Promise((resolve, reject) => {
    // Poll the durable job state every 1 second
    const pollInterval = setInterval(() => {
      const job = ContentOperatingSystem.getJob(jobId);
      if (!job) {
        clearInterval(pollInterval);
        reject(new Error("Job lost in engine state"));
      } else if (job.status === 'READY' && job.designSpec) {
        clearInterval(pollInterval);
        resolve(job.designSpec as DesignSpecification);
      } else if (job.status === 'FAILED') {
        clearInterval(pollInterval);
        reject(new Error(job.error || "Pipeline failed"));
      }
    }, 1000);

    // Hard timeout after 120s to prevent Vercel 504 on long tasks
    setTimeout(() => {
      clearInterval(pollInterval);
      reject(new Error("V2 Pipeline exceeded maximum wall clock execution time (120s)."));
    }, 120000);
  });
}
