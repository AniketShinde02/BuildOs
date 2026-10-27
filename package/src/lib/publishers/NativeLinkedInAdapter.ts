import { PublisherAdapter, PublishPayload, PublishResult } from "./PublisherAdapter";

export class NativeLinkedInAdapter implements PublisherAdapter {
  name = "NativeLinkedIn";
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token || process.env.LINKEDIN_ACCESS_TOKEN;
  }

  async checkHealth(): Promise<{ status: "healthy" | "error"; message?: string }> {
    if (!this.token) {
      return { status: "error", message: "Missing LinkedIn Access Token." };
    }

    try {
      // First try OIDC userinfo (better for modern tokens)
      let response = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${this.token}`, "LinkedIn-Version": "202401" },
      });
      
      if (!response.ok) {
        // Fallback to /v2/me
        response = await fetch("https://api.linkedin.com/v2/me", {
          headers: { Authorization: `Bearer ${this.token}`, "LinkedIn-Version": "202401", "X-Restli-Protocol-Version": "2.0.0" },
        });
      }
      
      if (!response.ok && !process.env.LINKEDIN_AUTHOR_URN) {
        return { status: "error", message: `Token invalid or lacks read scope. Status: ${response.status}.` };
      }
      
      return { status: "healthy" };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    if (payload.platform !== "linkedin") {
      return { success: false, platform: this.name, error: "Unsupported platform for this adapter." };
    }

    if (!this.token) {
      return { success: false, platform: this.name, error: "Missing LinkedIn Access Token." };
    }

    try {
      // 1. Resolve author URN (Organization priority over Person)
      let personUrn = process.env.LINKEDIN_AUTHOR_URN;
      
      if (!personUrn) {
        // Try to fetch organization first to post to company page (e.g. Aniket.work)
        const orgRes = await fetch("https://api.linkedin.com/v2/organizationAcls?q=roleAssignee", {
          headers: { Authorization: `Bearer ${this.token}`, "LinkedIn-Version": "202401", "X-Restli-Protocol-Version": "2.0.0" },
        });

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          if (orgData.elements && orgData.elements.length > 0) {
            personUrn = orgData.elements[0].organization; // format: urn:li:organization:12345
          }
        }

        // Fallback to Person URN if no organization is found
        if (!personUrn) {
          const uiRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${this.token}`, "LinkedIn-Version": "202401" },
          });
          
          if (uiRes.ok) {
            const uiData = await uiRes.json();
            personUrn = `urn:li:person:${uiData.sub}`;
          } else {
            const meRes = await fetch("https://api.linkedin.com/v2/me", {
              headers: {
                Authorization: `Bearer ${this.token}`,
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": "202401"
              },
            });
            if (!meRes.ok) {
              return { success: false, platform: this.name, error: `Auth failed (${meRes.status}). Ensure LINKEDIN_AUTHOR_URN is in .env.local if scopes are limited.` };
            }
            const meData = await meRes.json();
            personUrn = `urn:li:person:${meData.id}`;
          }
        }
      }

      // 2. Handle Images
      let mediaAssets: any[] = [];
      const imagesToUpload = payload.mediaUrls || [];

      for (const imgUrl of imagesToUpload) {
        try {
          const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.token}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify({
              registerUploadRequest: {
                recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                owner: personUrn,
                serviceRelationships: [
                  { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }
                ],
              },
            }),
          });

          if (!registerRes.ok) continue;

          const registerData = await registerRes.json();
          const uploadMechanism = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
          const uploadUrl = uploadMechanism.uploadUrl;
          const assetUrn = registerData.value.asset;

          let imageBuffer: Buffer;
          if (imgUrl.startsWith("data:image")) {
            const base64Data = imgUrl.split(",")[1];
            imageBuffer = Buffer.from(base64Data, "base64");
          } else {
            const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(15000) });
            if (!imgRes.ok) continue;
            const arrayBuffer = await imgRes.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          }

          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${this.token}`,
              "Content-Type": "application/octet-stream",
            },
            body: new Uint8Array(imageBuffer),
          });

          if (uploadRes.ok || uploadRes.status === 201) {
            mediaAssets.push({
              status: "READY",
              description: { text: "Generated Image" },
              media: assetUrn,
              title: { text: "Image" },
            });
          }
        } catch (e) {
          console.warn("[publish] Image processing error in NativeLinkedInAdapter", e);
        }
      }

      // 3. Publish via ugcPosts
      const postBody: any = {
        author: personUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: payload.text },
            shareMediaCategory: mediaAssets.length > 0 ? "IMAGE" : "NONE",
            ...(mediaAssets.length > 0 && { media: mediaAssets }),
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const lnRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postBody),
      });

      const rawResponse = await lnRes.json().catch(() => ({}));

      if (!lnRes.ok) {
        return {
          success: false,
          platform: this.name,
          error: rawResponse.message || `LinkedIn post failed (${lnRes.status})`,
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
