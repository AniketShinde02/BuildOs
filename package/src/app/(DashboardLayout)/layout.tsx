import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/utils/firebase-admin";
import ClientLayout from "./ClientLayout";

export default async function DashboardServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("buildos-token")?.value;

  if (!sessionCookie) {
    redirect("/authentication/login");
  }

  try {
    // Cryptographically verify the session token
    await adminAuth.verifyIdToken(sessionCookie);
  } catch (error) {
    console.error("Invalid session token:", error);
    // Invalid token (e.g. expired or spoofed), redirect to login
    redirect("/authentication/login");
  }

  return <ClientLayout>{children}</ClientLayout>;
}
