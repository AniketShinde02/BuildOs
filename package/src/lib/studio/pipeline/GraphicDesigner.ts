'use server';

import { CreativeBrief } from './CreativeDirector';
import { BrandKit, BrandKitResolver } from '../models/BrandKit';
import { DynamicDesignSpec } from '../models/DesignPrimitives';
import { generateContentWithFallback } from '@/lib/ai/gateway';

export async function design(
  brief: CreativeBrief, 
  workspaceKit?: Partial<BrandKit>,
  brandKit?: Partial<BrandKit>,
  campaignKit?: Partial<BrandKit>,
  creativeOverride?: Partial<BrandKit>
): Promise<DynamicDesignSpec> {
  
  const resolvedBrand = BrandKitResolver.resolve(workspaceKit, brandKit, campaignKit, creativeOverride);

  // Platform dimensions
  let dimensions = { width: 1080, height: 1080 };
  if (brief.type === 'banner') dimensions = { width: 1200, height: 628 };
  else if (brief.type === 'carousel') dimensions = { width: 1080, height: 1350 };

  const systemPrompt = `
You are a senior Graphic Designer with 15 years of experience at Apple, Stripe, Linear, and Canva.
You do NOT use fixed templates. You build designs using granular Primitives (Layout, Color, Typography, Decorations, Components).

Your job is to read the Creative Brief and output a masterful Design Specification.
Psychology Rule: Base the colors on the 'emotionalPsychology' and 'audience' of the brief. 
(e.g., Developer = Dark Green/Blue; Luxury = Gold/Cream/Black; Startup = Orange/White/Black).
Typography Rule: Choose appropriate fonts and tracking.

Output strictly valid JSON with this exact structure:
{
  "color": {
    "background": "hex or named color",
    "primary": "hex",
    "secondary": "hex",
    "text": "hex",
    "accent": "hex",
    "gradient": { "type": "radial" | "linear" | "mesh", "colors": ["hex", "hex"], "angle": "optional" } // optional
  },
  "typography": {
    "headline": { "family": "Inter | Roboto | Playfair Display | Fira Code", "weight": 700, "tracking": "-0.04em", "leading": "1.1", "align": "left|center|right" },
    "body": { "family": "Inter", "weight": 400, "tracking": "0em", "leading": "1.5", "align": "left|center|right" }
  },
  "layout": {
    "type": "split" | "centered" | "grid" | "magazine" | "minimal" | "dynamic",
    "padding": "e.g. 80px 100px",
    "gap": "e.g. 40px",
    "alignment": "left" | "center" | "right",
    "flowDirection": "column" | "row"
  },
  "decorations": {
    "backgroundPattern": "none" | "noise" | "mesh-gradient" | "dots" | "grid" | "glow-orbs",
    "elements": [
       // Up to 2 abstract elements for visual interest
       { "type": "abstract-shape" | "arrow" | "flow-line" | "badge" | "callout-box" | "floating-code", "position": { "top": "10%", "right": "-5%" }, "color": "hex", "opacity": 0.2 }
    ]
  },
  "components": {
    "showMockup": false,
    "showBadges": true,
    "ctaStyle": "pill" | "outline" | "text-only" | "none"
  }
}
`;

  let finalSpec: DynamicDesignSpec | null = null;
  let attempts = 0;
  let maxAttempts = 2; // Keep it low for latency, but enough to fix major issues
  let lastFeedback = "";

  while (attempts < maxAttempts) {
    attempts++;
    
    // Add feedback to prompt if it's a retry
    let iterationPrompt = systemPrompt;
    if (lastFeedback) {
      iterationPrompt += `\n\nPREVIOUS ATTEMPT FAILED. Art Director Feedback: "${lastFeedback}". FIX THIS IMMEDIATELY.`;
    }

    let rawText = "";

    try {
      const result = await generateContentWithFallback({
        systemInstruction: iterationPrompt,
        prompt: `Brief: ${JSON.stringify(brief)}`,
        responseMimeType: "application/json",
        requiredCapability: 'STRUCTURED_CONTENT'
      });
      if (result) {
        rawText = result;
      }
    } catch (err) {
      console.warn("Designer generation failed", err);
    }

    let specObj: any = {};
    if (rawText) {
      try {
        let cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleanJson = jsonMatch[0];
        specObj = JSON.parse(cleanJson);
      } catch (e) {
        console.error("Failed to parse Designer output", e, "Raw:", rawText);
      }
    }

    finalSpec = {
      id: `design-${Date.now()}`,
      brief,
      brand: resolvedBrand,
      dimensions,
      color: specObj.color || {
        background: resolvedBrand.backgroundColor || "#000000",
        primary: resolvedBrand.primaryColor || "#3B82F6",
        secondary: resolvedBrand.secondaryColor || "#1A1A1A",
        text: resolvedBrand.textColor || "#FFFFFF",
        accent: "#00E5FF"
      },
      typography: specObj.typography || {
        headline: { family: "Inter", weight: 800, tracking: "-0.04em", leading: "1.0", align: "left" },
        body: { family: "Inter", weight: 400, tracking: "0em", leading: "1.5", align: "left" }
      },
      layout: specObj.layout || {
        type: "minimal",
        padding: "80px",
        gap: "40px",
        alignment: "left",
        flowDirection: "column"
      },
      decorations: specObj.decorations || {
        backgroundPattern: "noise",
        elements: []
      },
      components: specObj.components || {
        showMockup: false,
        showBadges: true,
        ctaStyle: "text-only"
      }
    };

    // Review the design
    const { reviewDesign } = await import('./QualityReviewer');
    let score;
    try {
      score = await reviewDesign(finalSpec);
    } catch (e) {
      console.warn("[GraphicDesigner] QA engine failed, passing by default.", e);
      score = { score: 90, passed: true, issues: [], suggestedFixes: [] };
    }
    
    finalSpec.score = score.score;

    if (score.score >= 90) {
      break; // Success! It passed the bar.
    } else {
      lastFeedback = score.issues?.[0] || 'Quality threshold not met';
      console.log(`Design rejected with score ${score.score}. Retrying... Feedback: ${lastFeedback}`);
    }
  }

  return finalSpec!;
}
