/**
 * Comprehensive 11-Platform OAuth & Capability Matrix for BuildOS Connection Center.
 * Mandated by RC-3 Directive: No assumptions, exact API versions, documented scopes and content support.
 */

export type ProviderId = 
  | "linkedin"
  | "facebook"
  | "instagram"
  | "threads"
  | "bluesky"
  | "x"
  | "youtube"
  | "pinterest"
  | "tiktok"
  | "reddit"
  | "discord";

export interface PlatformCapabilities {
  id: ProviderId;
  name: string;
  logo: string;
  category: "Professional" | "Social" | "Video" | "Community";
  apiVersion: string;
  adapter: string;
  rateLimit: string;
  supportedContentTypes: string[];
  capabilities: {
    publishing: boolean;
    scheduling: boolean;
    mediaUpload: boolean;
    carouselSupport: boolean;
    videoSupport: boolean;
    storySupport: boolean;
    reelsSupport: boolean;
    shortsSupport: boolean;
    threadSupport: boolean;
    webhooks: boolean;
  };
  oauth: {
    authUrl: string;
    tokenEndpoint: string;
    defaultScopes: string[];
    documentationUrl: string;
  };
  defaultSettings?: Record<string, string | boolean>;
}

export const PLATFORM_REGISTRY: Record<ProviderId, PlatformCapabilities> = {
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    logo: "LK",
    category: "Professional",
    apiVersion: "v2 REST API (202401)",
    adapter: "NativeLinkedInAdapter",
    rateLimit: "100 posts / 24h per member",
    supportedContentTypes: ["Text", "Image", "Carousel", "Video", "Articles", "Documents"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: true,
      videoSupport: true,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: false,
      threadSupport: false,
      webhooks: true,
    },
    oauth: {
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenEndpoint: "https://www.linkedin.com/oauth/v2/accessToken",
      defaultScopes: ["w_member_social", "r_liteprofile", "r_emailaddress", "openid"],
      documentationUrl: "https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin",
    },
    defaultSettings: { autoGenerateAltText: true, shareTarget: "PUBLIC" }
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    logo: "FB",
    category: "Social",
    apiVersion: "Graph API v19.0",
    adapter: "NativeMetaAdapter",
    rateLimit: "200 calls / hour per user",
    supportedContentTypes: ["Text", "Image", "Video", "Reels", "Stories"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: true,
      videoSupport: true,
      storySupport: true,
      reelsSupport: true,
      shortsSupport: false,
      threadSupport: false,
      webhooks: true,
    },
    oauth: {
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenEndpoint: "https://graph.facebook.com/v19.0/oauth/access_token",
      defaultScopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "publish_video"],
      documentationUrl: "https://developers.facebook.com/docs/graph-api",
    },
    defaultSettings: { autoPublishToPage: true, hdVideoUpload: true }
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    logo: "IG",
    category: "Social",
    apiVersion: "Instagram Graph API v19.0",
    adapter: "NativeMetaAdapter (Instagram)",
    rateLimit: "25 content publishing API calls / 24h",
    supportedContentTypes: ["Image", "Carousel", "Reels", "Stories"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: true,
      videoSupport: true,
      storySupport: true,
      reelsSupport: true,
      shortsSupport: false,
      threadSupport: false,
      webhooks: true,
    },
    oauth: {
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenEndpoint: "https://graph.facebook.com/v19.0/oauth/access_token",
      defaultScopes: ["instagram_basic", "instagram_content_publish", "pages_show_list"],
      documentationUrl: "https://developers.facebook.com/docs/instagram-api",
    },
    defaultSettings: { defaultAspectRatio: "1:1", shareToFeed: true }
  },
  threads: {
    id: "threads",
    name: "Threads",
    logo: "TH",
    category: "Social",
    apiVersion: "Threads API v1.0",
    adapter: "PostizAdapter (Threads)",
    rateLimit: "250 publishing posts / 24h",
    supportedContentTypes: ["Text", "Image", "Carousel", "Video", "Threads"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: true,
      videoSupport: true,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: false,
      threadSupport: true,
      webhooks: true,
    },
    oauth: {
      authUrl: "https://threads.net/oauth/authorize",
      tokenEndpoint: "https://graph.threads.net/oauth/access_token",
      defaultScopes: ["threads_basic", "threads_content_publish"],
      documentationUrl: "https://developers.facebook.com/docs/threads",
    },
  },
  bluesky: {
    id: "bluesky",
    name: "Bluesky",
    logo: "BS",
    category: "Social",
    apiVersion: "AT Protocol v1 (XRPC)",
    adapter: "PostizAdapter (Bluesky)",
    rateLimit: "300 actions / 5 minutes",
    supportedContentTypes: ["Text", "Image", "Video Embed", "Threads"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: false,
      videoSupport: false,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: false,
      threadSupport: true,
      webhooks: false,
    },
    oauth: {
      authUrl: "https://bsky.social/xrpc/com.atproto.server.createSession",
      tokenEndpoint: "https://bsky.social/xrpc/com.atproto.server.refreshSession",
      defaultScopes: ["app.bsky.feed.post", "app.bsky.actor.getProfile"],
      documentationUrl: "https://docs.bsky.app",
    },
    defaultSettings: { handle: "@user.bsky.social", useAppPassword: true }
  },
  x: {
    id: "x",
    name: "X (Twitter)",
    logo: "X",
    category: "Social",
    apiVersion: "X API v2 (OAuth 2.0 PKCE)",
    adapter: "PostizAdapter (X)",
    rateLimit: "17 posts / 24h (Free), 100/day (Basic)",
    supportedContentTypes: ["Text", "Image", "Video", "Polls", "Threads"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: false,
      videoSupport: true,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: false,
      threadSupport: true,
      webhooks: true,
    },
    oauth: {
      authUrl: "https://twitter.com/i/oauth2/authorize",
      tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
      defaultScopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      documentationUrl: "https://developer.x.com/en/docs",
    },
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    logo: "YT",
    category: "Video",
    apiVersion: "YouTube Data API v3",
    adapter: "PostizAdapter (YouTube)",
    rateLimit: "10,000 units / day (~6 video uploads)",
    supportedContentTypes: ["Video", "Shorts", "Community Posts"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: false,
      videoSupport: true,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: true,
      threadSupport: false,
      webhooks: false,
    },
    oauth: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      defaultScopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
      documentationUrl: "https://developers.google.com/youtube/v3",
    },
    defaultSettings: { defaultPrivacy: "public", tagAsShorts: true }
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    logo: "PN",
    category: "Social",
    apiVersion: "Pinterest API v5",
    adapter: "PostizAdapter (Pinterest)",
    rateLimit: "200 requests / hour per token",
    supportedContentTypes: ["Image Pin", "Video Pin", "Carousel Pin"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: true,
      videoSupport: true,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: false,
      threadSupport: false,
      webhooks: false,
    },
    oauth: {
      authUrl: "https://www.pinterest.com/oauth/",
      tokenEndpoint: "https://api.pinterest.com/v5/oauth/token",
      defaultScopes: ["boards:read", "boards:write", "pins:read", "pins:write"],
      documentationUrl: "https://developers.pinterest.com/docs/api/v5/",
    },
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    logo: "TT",
    category: "Video",
    apiVersion: "Content Posting API v2",
    adapter: "PostizAdapter (TikTok)",
    rateLimit: "50 video publishes / 24h per user",
    supportedContentTypes: ["Video", "Photo Post (Carousel)"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: true,
      videoSupport: true,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: false,
      threadSupport: false,
      webhooks: true,
    },
    oauth: {
      authUrl: "https://www.tiktok.com/v2/auth/authorize/",
      tokenEndpoint: "https://open.tiktokapis.com/v2/oauth/token/",
      defaultScopes: ["user.info.basic", "video.publish", "video.upload"],
      documentationUrl: "https://developers.tiktok.com/doc/content-posting-api-get-started",
    },
    defaultSettings: { allowComments: true, allowDuet: true, allowStitch: true }
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    logo: "RD",
    category: "Community",
    apiVersion: "Reddit OAuth API (v1)",
    adapter: "PostizAdapter (Reddit)",
    rateLimit: "100 requests / 10 minutes",
    supportedContentTypes: ["Text (Self)", "Link", "Image", "Video", "Gallery"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: true,
      videoSupport: true,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: false,
      threadSupport: false,
      webhooks: false,
    },
    oauth: {
      authUrl: "https://www.reddit.com/api/v1/authorize",
      tokenEndpoint: "https://www.reddit.com/api/v1/access_token",
      defaultScopes: ["identity", "submit", "read", "flair"],
      documentationUrl: "https://www.reddit.com/dev/api/",
    },
    defaultSettings: { defaultSubreddit: "r/test", sendReplies: true }
  },
  discord: {
    id: "discord",
    name: "Discord",
    logo: "DS",
    category: "Community",
    apiVersion: "Discord API v10 / Webhook",
    adapter: "PostizAdapter (Discord)",
    rateLimit: "50 requests / second (Global), 5 / 2s (Webhook)",
    supportedContentTypes: ["Text", "Embeds", "Image Attachments", "Markdown"],
    capabilities: {
      publishing: true,
      scheduling: true,
      mediaUpload: true,
      carouselSupport: false,
      videoSupport: false,
      storySupport: false,
      reelsSupport: false,
      shortsSupport: false,
      threadSupport: true,
      webhooks: true,
    },
    oauth: {
      authUrl: "https://discord.com/api/oauth2/authorize",
      tokenEndpoint: "https://discord.com/api/oauth2/token",
      defaultScopes: ["webhook.incoming", "bot", "applications.commands"],
      documentationUrl: "https://discord.com/developers/docs/intro",
    },
    defaultSettings: { username: "BuildOS Bot", useEmbeds: true }
  }
};
