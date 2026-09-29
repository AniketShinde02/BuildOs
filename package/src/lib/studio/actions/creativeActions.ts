'use server';

import { CreativeOperatingSystem } from '../engine/CreativeOSEngines';
import { DesignSpecification } from '../models/DesignSpecification';

/**
 * Server action to execute the 11-engine AI Creative Operating System safely on the server.
 */
export async function generateCreativeSpecAction(prompt: string, platform: string = 'linkedin'): Promise<DesignSpecification> {
  return CreativeOperatingSystem.executePipeline(prompt, platform);
}
