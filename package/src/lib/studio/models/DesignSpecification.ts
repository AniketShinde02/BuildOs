export type LayoutFamily = 
  | 'linear-tech' 
  | 'editorial-magazine' 
  | 'swiss-grid' 
  | 'neo-brutalist' 
  | 'glass-surface' 
  | 'warm-humanist' 
  | 'saas-showcase' 
  | 'carousel-playbook' 
  | 'typographic-monument' 
  | 'dynamic-hybrid';

export interface DesignWhySpecification {
  creativeDirectionWhy: string;
  brandStrategyWhy: string;
  visualStrategyWhy: string;
  layoutWhy: string;
  typographyWhy: string;
  colorPsychologyWhy: string;
  compositionWhy: string;
  assetSelectionWhy: string;
  platformOptimizationWhy: string;
  humanizationWhy: string;
  qualityScoringWhy: string;
}

export interface DesignSpecification {
  id: string;
  prompt: string;
  format: 'carousel' | 'infographic' | 'quote' | 'banner' | 'cheatsheet' | 'roadmap' | 'comparison';
  rendererChoice?: 'Satori' | 'Remotion' | 'Canvas' | 'Playwright';
  dimensions: {
    width: number;
    height: number;
    aspectRatio: string;
    platform: string;
  };
  why: DesignWhySpecification;
  spec: {
    layoutFamily: LayoutFamily;
    variantId: string; // e.g. "01-Standard Card" up to "100-AI Creative Operating System Masterpiece"
    color: {
      background: string;
      surface: string;
      primary: string;
      secondary: string;
      textPrimary: string;
      textSecondary: string;
      accent: string;
      border: string;
      gradient?: string;
    };
    typography: {
      headline: { family: string; weight: number; tracking: string; leading: string; size: number };
      body: { family: string; weight: number; tracking: string; leading: string; size: number };
      caption: { family: string; weight: number; size: number };
      scaleRatio: number;
      scaleName: string; // e.g. "Golden Ratio (1.618)" or "Perfect Fourth (1.333)"
    };
    composition: {
      padding: string;
      gap: number;
      columns: number;
      flowDirection: 'row' | 'column';
      safeZones: { top: number; right: number; bottom: number; left: number };
      align: 'left' | 'center' | 'right' | 'space-between';
    };
    assets: {
      showBadge: boolean;
      badgeText?: string;
      backgroundPattern: 'none' | 'noise' | 'mesh-gradient' | 'dots' | 'grid' | 'glow-orbs' | 'editorial-lines';
      watermarkText?: string;
      showProgressDots?: boolean;
      totalSlides?: number;
      currentSlide?: number;
      showWindowControls?: boolean;
    };
  };
  content: {
    title: string;
    subtitle?: string;
    points: Array<{
      label?: string;
      text: string;
      metric?: string;
    }>;
    quoteText?: string;
    authorName?: string;
    ctaText?: string;
  };
  qualityScore: {
    overall: number; // 0 to 100
    contrastScore: number;
    hierarchyScore: number;
    balanceScore: number;
    humanTouchScore: number;
    critique: string;
  };
}
