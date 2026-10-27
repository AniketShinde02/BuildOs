import { generateContent } from "@/lib/ai/gateway";
import { CarouselSpec } from "./08_CarouselArchitect";
import { ContentBrief } from "../models/ContentJob";
import { DesignSpecification } from "../../../models/DesignSpecification";

export class VisualDirector {
  static async execute(carousel: CarouselSpec, brief: ContentBrief): Promise<DesignSpecification> {
    const systemInstruction = `You are the BuildOS Visual Director.
Determine the layout family, typography, and color palette that matches the audience and topic.
Choose layoutFamily from: linear-tech, editorial-magazine, swiss-grid, neo-brutalist, glass-surface, warm-humanist, saas-showcase, carousel-playbook, typographic-monument, dynamic-hybrid.

Return ONLY valid JSON matching this exact schema:

{
  "spec": {
    "layoutFamily": "<chosen_family>",
    "variantId": "default",
    "color": { "background": "", "surface": "", "primary": "", "secondary": "", "textPrimary": "", "textSecondary": "", "accent": "", "border": "", "gradient": "" },
    "typography": { 
      "headline": { "family": "", "weight": 800, "tracking": "", "leading": "", "size": 64 },
      "body": { "family": "", "weight": 400, "tracking": "", "leading": "", "size": 24 },
      "caption": { "family": "", "weight": 600, "size": 16 },
      "scaleRatio": 1.333, "scaleName": "Perfect Fourth"
    },
    "composition": { "padding": "64px", "gap": 24, "columns": 1, "flowDirection": "column", "safeZones": { "top": 60, "right": 60, "bottom": 80, "left": 60 }, "align": "left" },
    "assets": { "showBadge": true, "badgeText": "BUILDOS", "backgroundPattern": "none", "watermarkText": "", "showProgressDots": true, "totalSlides": ${carousel.slides.length}, "currentSlide": 1, "showWindowControls": false }
  },
  "content": {
    "title": "${carousel.slides[0]?.headline.replace(/"/g, '\\"') || 'Title'}",
    "subtitle": "${carousel.slides[0]?.body.replace(/"/g, '\\"') || 'Subtitle'}",
    "points": [],
    "ctaText": "Swipe"
  },
  "why": {
    "creativeDirectionWhy": "...", "brandStrategyWhy": "...", "visualStrategyWhy": "...", "layoutWhy": "...",
    "typographyWhy": "...", "colorPsychologyWhy": "...", "compositionWhy": "...", "assetSelectionWhy": "...",
    "platformOptimizationWhy": "...", "humanizationWhy": "...", "qualityScoringWhy": "..."
  },
  "qualityScore": { "overall": 95, "contrastScore": 95, "hierarchyScore": 95, "balanceScore": 95, "humanTouchScore": 95, "critique": "" }
}`;

    const result = await generateContent({
      prompt: JSON.stringify({ audience: brief.audience, format: brief.likelyFormat }),
      systemInstruction,
      capability: 'DESIGN_SPEC',
      structuredOutput: true
    });

    if (!result.text) {
      throw new Error("Visual Director failed.");
    }

    try {
      const cleanedJson = result.text.replace(/```json\n?|\n?```/gi, '').trim();
      const parsed = JSON.parse(cleanedJson);
      
      // Merge with base standard format
      return {
        id: `creative_${Date.now()}`,
        prompt: "Generated from pipeline",
        format: 'carousel',
        dimensions: { width: 1080, height: 1350, aspectRatio: "4:5 Vertical Portrait", platform: "linkedin" },
        why: parsed.why,
        spec: parsed.spec,
        content: parsed.content,
        qualityScore: parsed.qualityScore,
        rendererChoice: 'Remotion'
      } as DesignSpecification;
    } catch {
      throw new Error("Visual Director produced invalid schema.");
    }
  }
}
