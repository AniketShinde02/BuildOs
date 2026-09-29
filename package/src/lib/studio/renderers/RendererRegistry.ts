import { DynamicDesignSpec } from '../models/DesignPrimitives';

export interface RendererOutput {
  url?: string;
  blob?: Blob;
  status: 'success' | 'failed';
  error?: string;
}

export interface IRenderer {
  id: string;
  name: string;
  capabilities: {
    supportsGrid: boolean;
    supportsWOFF2: boolean;
    supportsComplexCSS: boolean;
    requiresGPU: boolean;
  };
  render(spec: DynamicDesignSpec): Promise<RendererOutput>;
}

export class RendererRegistry {
  private static renderers: Map<string, IRenderer> = new Map();

  static register(renderer: IRenderer) {
    this.renderers.set(renderer.id, renderer);
  }

  static getRenderer(id: string): IRenderer | undefined {
    return this.renderers.get(id);
  }

  static getOptimalRenderer(spec: DynamicDesignSpec): IRenderer {
    // For Phase 1, always default to Satori
    // Future: Capability matching based on spec.layout complexity
    const satori = this.getRenderer('satori');
    if (!satori) throw new Error('Satori renderer not registered!');
    return satori;
  }
}
