export interface PublisherAdapter {
  /**
   * The name of the adapter (e.g. "NativeLinkedIn", "Postiz")
   */
  name: string;

  /**
   * Check if the required credentials/tokens are configured and valid for this adapter.
   * Should return true only if a live check succeeds.
   */
  checkHealth(): Promise<{ status: "healthy" | "error"; message?: string }>;

  /**
   * Publish a post to the target platform.
   * @param payload The content and metadata for the post.
   * @returns A structured result containing success status and provider response.
   */
  publish(payload: PublishPayload): Promise<PublishResult>;
}

export interface PublishPayload {
  text: string;
  mediaUrls?: string[];
  platform: "linkedin" | "twitter" | "facebook" | "instagram" | "mastodon";
  // Any adapter-specific options can be passed here
  options?: Record<string, any>;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  postId?: string;
  postUrl?: string;
  error?: string;
  rawResponse?: any;
}
