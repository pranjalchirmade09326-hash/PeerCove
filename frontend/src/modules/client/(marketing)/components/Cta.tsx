/**
 * Cta — final call-to-action section on the PeerCove marketing page.
 *
 * Layer: client / (marketing) / components
 *
 * Invites visitors to start a guided intake or learn more about the platform.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { AuthResponse } from "@/modules/server/auth/types";

/**
 * Full-width CTA banner encouraging sign-up or a platform inquiry.
 *
 * @param session - Active auth session; controls CTA button variant.
 */
export default function Cta({ session }: { session: AuthResponse | null }) {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2.5rem] overflow-hidden bg-primary px-6 py-16 sm:px-16 sm:py-24 text-center shadow-2xl"
        >
          {/* Decorative SVG */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground tracking-tight">
              You can take the first step today
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Take the first step with a guided chat or voice intake, then keep
              appointments and health information together in PeerCove.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              {!session ? (
                <>
                  <OAuthPkceButton href="/signup" size="lg" variant="secondary"
                    className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Get started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </OAuthPkceButton>
                  <Link href="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto rounded-full px-8 h-14 text-lg bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      Learn about the care platform
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={((session.session.activeRoleRedirectUrl ?? "/bezs/telemedicine/doctor/dashboard").replace(/^\/(?:en|hi|ta)/, "") || "/bezs/telemedicine/doctor/dashboard") as any}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Open Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
