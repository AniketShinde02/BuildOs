import { PublisherAdapter, PublishPayload, PublishResult } from "./PublisherAdapter";
import { BuildOSError } from "../errors/BuildOSError";

export class UploadPostAdapter implements PublisherAdapter {
  name = "UploadPost (Optional/Limited)";

  async checkHealth(): Promise<{ status: "healthy" | "error"; message?: string }> {
    const apiKey = process.env.UPLOAD_POST_API_KEY;

    if (!apiKey) {
      return { status: "error", message: "Missing UPLOAD_POST_API_KEY in environment." };
    }

    // Upload-Post health check logic
    return { status: "healthy", message: "Warning: Free tier limited to 10 posts/month." };
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    const apiKey = process.env.UPLOAD_POST_API_KEY;

    if (!apiKey) {
      const err = new BuildOSError({
        message: "Upload-Post adapter missing API credentials.",
        source: "Adapter",
        adapter: this.name,
        rootCause: "UPLOAD_POST_API_KEY environment variable is unset.",
        suggestedFix: "Add UPLOAD_POST_API_KEY to your .env.local file.",
        retryOption: false,
      });
      return { success: false, platform: this.name, error: err.toJSON() as any };
    }

    try {
      const response = await fetch("https://api.upload-post.com/v1/publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          text: payload.text,
          networks: [payload.platform],
          media: payload.mediaUrls || [],
        }),
      });

      const rawResponse = await response.json();

      if (!response.ok) {
        const err = new BuildOSError({
          message: rawResponse.error || "Upload-Post API publishing error.",
          source: "PublishPipeline",
          adapter: this.name,
          rootCause: `Remote API returned HTTP status ${response.status}.`,
          suggestedFix: "Verify account quota and valid network target selection.",
          retryOption: response.status >= 500 || response.status === 429,
          payload,
          endpoint: "https://api.upload-post.com/v1/publish",
        });
        return {
          success: false,
          platform: this.name,
          error: err.toJSON() as any,
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
      const netErr = BuildOSError.fromError(error, "Network", {
        adapter: this.name,
        endpoint: "https://api.upload-post.com/v1/publish",
        payload,
      });
      return {
        success: false,
        platform: this.name,
        error: netErr.toJSON() as any,
      };
    }
  }
}

