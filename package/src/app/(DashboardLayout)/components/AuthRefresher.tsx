'use client';
import { useEffect } from 'react';
import { auth } from '@/utils/firebase';

/**
 * AuthRefresher - Silent token refresh component.
 * 
 * Firebase ID tokens expire every 60 minutes.
 * This component runs in the background and refreshes the server-side
 * session cookie 5 minutes before expiry, preventing users from being
 * kicked to the login page mid-session.
 * 
 * Mount this once in ClientLayout.tsx.
 */
export default function AuthRefresher() {
  useEffect(() => {
    // Refresh immediately on mount (handles page reload edge case)
    const refreshSession = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        // Force-refresh the token from Firebase
        const idToken = await user.getIdToken(true);
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch (error) {
        console.error('[AuthRefresher] Token refresh failed:', error);
      }
    };

    // Refresh every 55 minutes (token expires at 60)
    refreshSession();
    const interval = setInterval(refreshSession, 55 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null; // Renders nothing
}
