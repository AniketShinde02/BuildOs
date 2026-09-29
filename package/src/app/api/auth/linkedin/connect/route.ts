import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Missing LINKEDIN_CLIENT_ID in .env.local" }, { status: 500 });
  }

  const redirectUri = `${protocol}://${host}/api/auth/linkedin/callback`;
  const scope = "w_member_social r_liteprofile r_emailaddress";
  const state = Math.random().toString(36).substring(7);

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(linkedinAuthUrl);
}
