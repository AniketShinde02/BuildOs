import { PublisherAdapter, PublishPayload, PublishResult } from "./PublisherAdapter";

export class NativeMetaAdapter implements PublisherAdapter {
  name = "NativeMeta";

  async checkHealth(): Promise<{ status: "healthy" | "error"; message?: string }> {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
      return { status: "error", message: "Missing META_ACCESS_TOKEN in environment." };
    }

    try {
      // Ping the Graph API to verify token
      const response = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
      
      if (!response.ok) {
        return { status: "error", message: `Meta Token invalid or expired. Status: ${response.status}` };
      }
      
      return { status: "healthy" };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    if (payload.platform !== "instagram" && payload.platform !== "facebook") {
      return { success: false, platform: this.name, error: "Unsupported platform." };
    }

    const token = process.env.META_ACCESS_TOKEN;
    const igAccountId = process.env.IG_ACCOUNT_ID;
    const pageId = process.env.FB_PAGE_ID;

    if (!token) {
      return { success: false, platform: this.name, error: "Missing META_ACCESS_TOKEN." };
    }

    try {
      let url = "";
      let postBody: any = {};

      if (payload.platform === "instagram") {
        if (!igAccountId) return { success: false, platform: this.name, error: "Missing IG_ACCOUNT_ID." };
        // Simplified IG publish: First create container, then publish container.
        // For this adapter skeleton, we will assume standard Graph API flow.
        url = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
        postBody = {
          caption: payload.text,
          image_url: payload.mediaUrls?.[0] || "",
          access_token: token,
        };
        // Note: Real IG Graph API requires a 2-step process (create media container -> publish).
        // This is a placeholder for the first step. 
      } else if (payload.platform === "facebook") {
        if (!pageId) return { success: false, platform: this.name, error: "Missing FB_PAGE_ID." };
        url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
        postBody = {
          message: payload.text,
          link: payload.mediaUrls?.[0] || "",
          access_token: token,
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody),
      });

      const rawResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          platform: this.name,
          error: rawResponse.error?.message || "Meta API error.",
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
