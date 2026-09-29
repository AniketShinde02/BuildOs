import { BrandKit } from "./BrandKit";

export interface ColorEngineSpec {
  background: string;
  primary: string;
  secondary: string;
  text: string;
  accent: string;
  gradient?: {
    type: 'linear' | 'radial' | 'mesh';
    colors: string[];
    angle?: string;
  };
}

export interface TypographyEngineSpec {
  headline: {
    family: string;
    weight: number;
    tracking: string; // e.g. "-0.04em"
    leading: string;  // e.g. "1.1"
    align: 'left' | 'center' | 'right';
    size?: string;
  };
  body: {
    family: string;
    weight: number;
    tracking: string;
    leading: string;
    align: 'left' | 'center' | 'right';
    size?: string;
  };
}

export interface LayoutEngineSpec {
  type: 'split' | 'centered' | 'grid' | 'magazine' | 'minimal' | 'masonry' | 'dynamic';
  padding: string; // e.g. "80px 100px"
  gap: string; // e.g. "40px"
  alignment: 'left' | 'center' | 'right';
  flowDirection: 'row' | 'column';
}

export interface DecorationEngineSpec {
  backgroundPattern: 'none' | 'noise' | 'mesh-gradient' | 'dots' | 'grid' | 'glow-orbs';
  elements: Array<{
    type: 'abstract-shape' | 'arrow' | 'flow-line' | 'badge' | 'callout-box' | 'floating-code' | '3d-object';
    position: { top?: string, left?: string, right?: string, bottom?: string };
    color: string;
    opacity: number;
  }>;
}

export interface ComponentEngineSpec {
  showMockup: boolean;
  mockupType?: 'browser' | 'mobile' | 'terminal';
  showBadges: boolean;
  ctaStyle: 'pill' | 'solid' | 'outline' | 'text-only' | 'none';
  showProgressBars?: boolean;
}

export interface DynamicDesignSpec {
  id: string; // generated id
  brief: {
    prompt: string;
    hook: string;
    points: string[];
    quoteText?: string;
    authorName?: string;
    marketingGoal: string;
    audience: string;
    platform: string;
    emotionalPsychology: string;
    type: 'infographic' | 'quote' | 'banner' | 'carousel';
  };
  brand: BrandKit;
  dimensions: { width: number; height: number };
  
  // The Primitives
  color: ColorEngineSpec;
  typography: TypographyEngineSpec;
  layout: LayoutEngineSpec;
  decorations: DecorationEngineSpec;
  components: ComponentEngineSpec;
  
  score?: number; // Quality Reviewer Score
}
