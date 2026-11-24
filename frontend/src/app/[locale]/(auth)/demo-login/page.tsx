/**
 * Demo Sign-In Page
 * Provides a unified demo login experience with all demo accounts
 */

"use client";

import React from "react";
import { useLocale } from "next-intl";
import { AppLogo } from "@/modules/client/shared/components/AppLogo";
import { DemoLoginComponent } from "@/modules/client/shared/components/demo-login";
import { Link } from "@/i18n/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ArrowLeft, Heart } from "lucide-react";

export default function DemoSignInPage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center space-x-2.5 group"
          >
            <AppLogo size={48} className="w-12 h-12 text-emerald-700 group-hover:scale-110 transition-transform" />
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground group-hover:text-emerald-700 transition-colors">
              PeerCove
            </h1>
          </Link>
          <p className="text-lg text-muted-foreground font-medium">
            A Calmer, Stepped-Care Space for Mental Wellbeing
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-2 border-emerald-200 dark:border-emerald-900/40 shadow-2xl bg-card/95 backdrop-blur-sm rounded-3xl overflow-hidden mb-6">
          <CardHeader className="space-y-2 pb-6 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/30 border-b-2 border-emerald-200 dark:border-emerald-900/40">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
              <CardTitle className="text-3xl font-bold tracking-tight text-center">
                Demo Access
              </CardTitle>
              <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <CardDescription className="text-center text-sm">
              Explore PeerCove with pre-configured demo accounts. No setup needed!
            </CardDescription>
          </CardHeader>

          <div className="p-8 space-y-6">
            <DemoLoginComponent />

            {/* Info sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  👩‍💼 For Members
                </h4>
                <p className="text-xs text-muted-foreground">
                  Experience personal dashboard, journal, mood tracking, and
                  support sessions.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  🎧 For Listeners
                </h4>
                <p className="text-xs text-muted-foreground">
                  Explore listener workspace, conversations, ratings, and
                  availability management.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  👨‍💻 For Admins
                </h4>
                <p className="text-xs text-muted-foreground">
                  Access admin dashboard with platform analytics and user
                  management.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Info alerts */}
        <div className="space-y-4 mb-6">
          <Alert className="border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20">
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              ℹ️ <strong>Demo accounts are for testing purposes only.</strong> All
              data is persistent and shared across demo logins.
            </AlertDescription>
          </Alert>

          <Alert className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20">
            <AlertDescription className="text-sm text-emerald-900 dark:text-emerald-100">
              💡 <strong>First time here?</strong> Click on any demo account card to
              see the credentials, then click "Sign in" to access that dashboard.
            </AlertDescription>
          </Alert>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href={`/${locale}/login`}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
          >
            Regular Sign In
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Heart footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          Made with{" "}
          <Heart className="w-3 h-3 inline text-red-500 fill-current" /> for
          mental wellbeing
        </div>
      </div>
    </div>
  );
}
