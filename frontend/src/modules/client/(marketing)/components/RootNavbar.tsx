/**
 * RootNavbar — fixed top navigation for the PeerCove marketing landing page.
 *
 * Layer: client / (marketing) / components
 *
 * Renders the brand logo, patient-focused navigation, and action buttons (Sign In / Sign Up or Open App if
 * already authenticated). Becomes opaque + blurred on scroll.
 */

"use client";

import { Button } from "@/components/ui/button";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import { ThemeSwitcher } from "@/theme/ThemeSwitcher";
import { Link, useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { AuthResponse } from "@/modules/server/auth/types";
import { AppLogo } from "@/modules/client/shared/components/AppLogo";

/**
 * Top navigation bar for the marketing landing page.
 *
 * @param session - Current server session (null if unauthenticated).
 */
export default function RootNavbar({
  session,
}: {
  session: AuthResponse | null;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const user = session
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        username: session.user.username,
      }
    : null;

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-primary">
            <AppLogo size={32} className="w-8 h-8" />
            <span className="text-2xl font-bold text-foreground tracking-tight">
              PeerCove
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-7">
            <Link
              href="/how-it-works"
              className="text-muted-foreground font-medium hover:text-primary transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#support"
              className="text-muted-foreground font-medium hover:text-primary transition-colors"
            >
              Your support
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground font-medium hover:text-primary transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/hipaa"
              className="text-muted-foreground font-medium hover:text-primary transition-colors"
            >
              Privacy
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {!user ? (
              <>
                <OAuthPkceButton
                  href="/login"
                  variant="ghost"
                  size="sm"
                  className="font-semibold rounded-full"
                >
                  Sign In
                </OAuthPkceButton>
                <OAuthPkceButton
                  href="/signup"
                  size="sm"
                  className="rounded-full px-6 shadow-md hover:shadow-lg transition-all"
                >
                  Get started
                </OAuthPkceButton>
              </>
            ) : (
              <Button
                size="sm"
                className="rounded-full px-6 shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  const rawUrl =
                    session?.session.activeRoleRedirectUrl ??
                    "/peercove/member";
                  const cleanUrl = rawUrl.replace(/^\/(?:en|hi|ta)/, "");
                  router.push(cleanUrl as any);
                }}
              >
                Open Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
