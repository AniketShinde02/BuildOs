import { PublisherAdapter, PublishPayload, PublishResult } from "./PublisherAdapter";

export class MixpostAdapter implements PublisherAdapter {
  name = "Mixpost";

  async checkHealth(): Promise<{ status: "healthy" | "error"; message?: string }> {
    const apiKey = process.env.MIXPOST_API_KEY;
    const apiUrl = process.env.MIXPOST_API_URL;

    if (!apiKey || !apiUrl) {
      return { status: "error", message: "Missing MIXPOST_API_KEY or MIXPOST_API_URL in environment." };
    }

    try {
      const response = await fetch(`${apiUrl}/api/v1/accounts`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      
      if (!response.ok) {
        return { status: "error", message: `Mixpost Token invalid. Status: ${response.status}` };
      }
      
      return { status: "healthy" };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    const apiKey = process.env.MIXPOST_API_KEY;
    const apiUrl = process.env.MIXPOST_API_URL;

    if (!apiKey || !apiUrl) {
      return { success: false, platform: this.name, error: "Missing Mixpost API configuration." };
    }

    try {
      const response = await fetch(`${apiUrl}/api/v1/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: [{ body: payload.text }],
          // Mixpost expects account IDs, so you'd normally map payload.platform to an account ID here.
          // For simplicity in this skeleton, we assume the environment manages the default accounts.
        }),
      });

      const rawResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          platform: this.name,
          error: rawResponse.message || "Mixpost API error.",
          rawResponse,
        };
      }

      return {
        success: true,
        platform: this.name,
        postId: rawResponse.id,
        rawResponse,
      };
    } catch (error: any) {
      return {
        success: false,
        platform: this.name,
        error: error.message || "Network error.",
      };
    }
  }
}
