import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testEngine() {
  const { CreativeOperatingSystem } = await import('../src/lib/studio/engine/CreativeOSEngines');
  
  console.log("Testing Full Creative OS Engine Pipeline");
  
  try {
    const spec = await CreativeOperatingSystem.executePipeline(
      "Q4 Enterprise Security Audit & AI Infrastructure Data Findings for Executive Briefing Report",
      "linkedin"
    );
    
    console.log("\nSuccess! Spec Generated:");
    console.log(`Title: ${spec?.content?.title}`);
    console.log(`Format: ${spec?.format}`);
  } catch (error: any) {
    console.error("Failed:", error.message);
  }
}

testEngine().catch(console.error);
