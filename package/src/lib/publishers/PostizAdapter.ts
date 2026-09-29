import { PublisherAdapter, PublishPayload, PublishResult } from "./PublisherAdapter";

export class PostizAdapter implements PublisherAdapter {
  name = "Postiz";
  private apiKey?: string;
  private apiUrl?: string;

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || process.env.POSTIZ_API_KEY;
    this.apiUrl = (apiUrl || process.env.POSTIZ_API_URL || "http://127.0.0.1:5000/api").replace("localhost", "127.0.0.1");
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      headers["x-api-key"] = this.apiKey;
    }
    return headers;
  }

  async checkHealth(): Promise<{ status: "healthy" | "error"; message?: string }> {
    if (!this.apiKey) {
      return { status: "error", message: "Missing POSTIZ_API_KEY or connection credentials." };
    }

    try {
      // Test health with strict 2000ms timeout to guarantee no blocking renders
      const response = await fetch(`${this.apiUrl}/public/v1/integrations`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(2000),
      }).catch(() => null);

      if (!response || !response.ok) {
        const healthCheck = await fetch(`${this.apiUrl}/public/v1/is-connected`, { 
          method: "GET",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(2000),
        }).catch(() => null);

        if (healthCheck && healthCheck.ok) {
          return { status: "healthy", message: "Postiz service connected." };
        }
        return { status: "error", message: `Postiz server unreachable at ${this.apiUrl}. Check Docker stack.` };
      }

      const data = await response.json();
      return { status: "healthy", message: `Connected to Postiz (Active integrations: ${Array.isArray(data) ? data.length : 0})` };
    } catch (error: any) {
      return { status: "error", message: `Connection timed out or failed: ${error.message}` };
    }
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    if (!this.apiKey) {
      return { success: false, platform: this.name, error: "Missing Postiz API Key." };
    }

    try {
      const endpoint = `${this.apiUrl}/public/v1/posts`;
      const postBody = {
        content: payload.text,
        platforms: [payload.platform],
        media: payload.mediaUrls && payload.mediaUrls.length > 0 ? payload.mediaUrls : [],
        ...payload.options,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(postBody),
      });

      const rawResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          platform: this.name,
          error: rawResponse.message || rawResponse.error || `Postiz error (${response.status})`,
          rawResponse,
        };
      }

      return {
        success: true,
        platform: this.name,
        postId: rawResponse.id || rawResponse.postId || "postiz-ok",
        rawResponse,
      };
    } catch (error: any) {
      return {
        success: false,
        platform: this.name,
        error: error.message || "Network or internal error posting to Postiz.",
      };
    }
  }
}
