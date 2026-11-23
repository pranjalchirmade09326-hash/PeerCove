"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect and gracefully handle Render free-tier cold starts.
 * Pings /api/health or backend health endpoint on initial client mount.
 */
export function useServerWake() {
  const [isWaking, setIsWaking] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted && !isReady) {
        setIsWaking(true);
      }
    }, 2000);

    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (res.ok && isMounted) {
          setIsReady(true);
          setIsWaking(false);
        }
      } catch {
        // Retry once after 3 seconds
        setTimeout(async () => {
          try {
            const retryRes = await fetch("/api/health", { cache: "no-store" });
            if (retryRes.ok && isMounted) {
              setIsReady(true);
              setIsWaking(false);
            }
          } catch {
            // Silently continue
          }
        }, 3000);
      } finally {
        clearTimeout(timeout);
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [isReady]);

  return { isWaking, isReady };
}
