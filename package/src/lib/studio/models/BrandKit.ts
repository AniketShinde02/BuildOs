export interface BrandKit {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string; // e.g. 'Inter', 'Geist'
  logoUrl?: string;
  style: 'dark' | 'light' | 'auto';
  authorName?: string;
  linkedinUrl?: string;
}

/**
 * Base workspace fallback brand kit
 */
export const DefaultBrandKit: BrandKit = {
  primaryColor: '#3B82F6', // Electric Cobalt
  secondaryColor: '#27272A', // Zinc 800
  backgroundColor: '#09090B', // Zinc 950
  textColor: '#FAFAFA', // Zinc 50
  fontFamily: 'Inter',
  style: 'dark',
};

export class BrandKitResolver {
  /**
   * Resolves the final BrandKit by overlaying Campaign and Creative specific overrides
   * on top of the base Workspace/Brand kit.
   * 
   * Hierarchy: Global -> Workspace -> Brand -> Campaign -> Creative
   */
  static resolve(
    workspaceKit?: Partial<BrandKit> | null,
    brandKit?: Partial<BrandKit> | null,
    campaignKit?: Partial<BrandKit> | null,
    creativeOverride?: Partial<BrandKit> | null
  ): BrandKit {
    // Merge sequentially. Later arguments overwrite earlier ones.
    return {
      ...DefaultBrandKit,
      ...workspaceKit,
      ...brandKit,
      ...campaignKit,
      ...creativeOverride
    };
  }
}
