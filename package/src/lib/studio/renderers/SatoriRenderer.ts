import { IRenderer, RendererOutput } from './RendererRegistry';
import { DesignSpecification } from '../models/DesignSpecification';

export class SatoriRenderer implements IRenderer {
  id = 'satori';
  name = 'Vercel Satori + Resvg';
  capabilities = {
    supportsGrid: false,
    supportsWOFF2: false,
    supportsComplexCSS: false,
    requiresGPU: false,
  };

  async render(spec: any): Promise<RendererOutput> {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
      
      const response = await fetch(`${baseUrl}/api/og/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spec)
      });

      if (!response.ok) {
        throw new Error(`Satori render engine failed: ${response.statusText}`);
      }

      // Convert the binary image response to a base64 data URL for the <img> src
      if (typeof window !== 'undefined') {
        const blob = await response.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ status: 'success', url: reader.result as string });
          reader.readAsDataURL(blob);
        });
      } else {
        // Node environment
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return { status: 'success', url: `data:image/png;base64,${buffer.toString('base64')}` };
      }
    } catch (e: any) {
      console.error('Satori render failed', e);
      return {
        status: 'failed',
        url: '',
        error: e.message
      };
    }
  }
}
