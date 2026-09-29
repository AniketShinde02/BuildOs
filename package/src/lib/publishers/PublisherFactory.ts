import { PublisherAdapter } from "./PublisherAdapter";
import { NativeLinkedInAdapter } from "./NativeLinkedInAdapter";
import { NativeMetaAdapter } from "./NativeMetaAdapter";
import { PostizAdapter } from "./PostizAdapter";
import { MixpostAdapter } from "./MixpostAdapter";
import { UploadPostAdapter } from "./UploadPostAdapter";
import { PLATFORM_REGISTRY, ProviderId } from "./PlatformCapabilities";
import { BuildOSError } from "../errors/BuildOSError";

export class PublisherFactory {
  // Synchronous fallback from environment (Strict Platform Priority)
  static getAdapter(platform: string): PublisherAdapter | null {
    if (platform === "linkedin" && (process.env.LINKEDIN_ACCESS_TOKEN || process.env.LINKEDIN_AUTHOR_URN)) {
      return new NativeLinkedInAdapter(process.env.LINKEDIN_ACCESS_TOKEN);
    }
    if ((platform === "facebook" || platform === "instagram" || platform === "meta") && process.env.META_ACCESS_TOKEN) {
      return new NativeMetaAdapter();
    }
    if (platform === "postiz" && (process.env.POSTIZ_API_KEY || process.env.POSTIZ_API_URL)) {
      return new PostizAdapter(process.env.POSTIZ_API_KEY, process.env.POSTIZ_API_URL);
    }
    if (platform !== "postiz" && process.env.POSTIZ_API_KEY) {
      return new PostizAdapter(process.env.POSTIZ_API_KEY, process.env.POSTIZ_API_URL);
    }
    if (process.env.MIXPOST_API_KEY) return new MixpostAdapter();
    if (process.env.UPLOAD_POST_API_KEY) return new UploadPostAdapter();
    return null;
  }

  // Modern async, user-isolated connection loader via Firestore REST API with token lifecycle rules
  static async getAdapterAsync(userId: string, sessionCookie: string, platform: string, allowFallback: boolean = true): Promise<PublisherAdapter | null> {
    try {
      const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (!PROJECT_ID) throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");

      const fetchConnection = async (connectionId: string) => {
        const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Users/${userId}/Connections/${connectionId}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${sessionCookie}` },
          signal: AbortSignal.timeout(2500),
        }).catch(() => null);
        if (!res || !res.ok) return null;
        const data = await res.json().catch(() => ({}));
        
        if (data.fields) {
          const parsed: any = {};
          for (const key of Object.keys(data.fields)) {
            parsed[key] = data.fields[key].stringValue || data.fields[key].integerValue || data.fields[key].booleanValue;
          }
          // Validate token lifecycle expiration if present
          if (parsed.expiresAt && Number(parsed.expiresAt) < Date.now()) {
            console.warn(`[PublisherFactory] Token for ${connectionId} has expired at ${new Date(Number(parsed.expiresAt)).toISOString()}`);
            parsed.isExpired = true;
          }
          return parsed;
        }
        return null;
      };

      const providerConfig = PLATFORM_REGISTRY[platform as ProviderId];

      // 1. Strict resolution for LinkedIn
      if (platform === "linkedin") {
        const liData = await fetchConnection("linkedin");
        if (liData && liData.isExpired) {
          throw new BuildOSError({
            message: "LinkedIn OAuth access token has expired.",
            source: "OAuth",
            adapter: "NativeLinkedInAdapter",
            rootCause: "Token lifecycle 60-day window exceeded.",
            suggestedFix: "Click Reconnect on the LinkedIn provider card in Connection Center.",
            retryOption: false,
          });
        }
        if (liData && liData.accessToken && !liData.isExpired) {
          return new NativeLinkedInAdapter(liData.accessToken);
        }
        if (process.env.LINKEDIN_ACCESS_TOKEN || process.env.LINKEDIN_AUTHOR_URN) {
          return new NativeLinkedInAdapter(process.env.LINKEDIN_ACCESS_TOKEN);
        }
        if (!allowFallback) return null;
      }

      // 2. Strict resolution for Meta (Facebook/Instagram)
      if (platform === "facebook" || platform === "instagram" || platform === "meta") {
        const metaData = await fetchConnection(platform === "instagram" ? "instagram" : "meta");
        if (metaData && metaData.isExpired) {
          throw new BuildOSError({
            message: "Meta OAuth access token expired.",
            source: "OAuth",
            adapter: "NativeMetaAdapter",
            rootCause: "Long-lived Meta Graph token expired or revoked.",
            suggestedFix: "Re-authorize your Facebook/Instagram Pages via Connection Center.",
            retryOption: false,
          });
        }
        if (metaData && metaData.accessToken && !metaData.isExpired) {
          return new NativeMetaAdapter();
        }
        if (process.env.META_ACCESS_TOKEN) {
          return new NativeMetaAdapter();
        }
        if (!allowFallback) return null;
      }

      // 3. Resolution for Postiz engine & expanded social matrix (Threads, Bluesky, X, YouTube, Pinterest, TikTok, Reddit, Discord)
      const postizData = await fetchConnection("postiz");
      const isExtendedPlatform = ["threads", "bluesky", "x", "youtube", "pinterest", "tiktok", "reddit", "discord"].includes(platform);
      
      if (platform === "postiz" || isExtendedPlatform || allowFallback) {
        if (postizData && postizData.apiKey && !postizData.isExpired) {
          const adapter = new PostizAdapter(postizData.apiKey, postizData.apiUrl);
          if (isExtendedPlatform) {
            // Configure Postiz adapter target for expanded providers
            (adapter as any).targetProvider = platform;
          }
          return adapter;
        }
        if (process.env.POSTIZ_API_KEY) {
          return new PostizAdapter(process.env.POSTIZ_API_KEY, process.env.POSTIZ_API_URL);
        }
      }

      // 4. Fallback to static env configuration
      return this.getAdapter(platform);
    } catch (e: any) {
      if (e instanceof BuildOSError) throw e;
      console.error("Error loading async adapter:", e);
      return this.getAdapter(platform);
    }
  }
}

