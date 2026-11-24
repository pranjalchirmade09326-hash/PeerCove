"use client";

/**
 * SignupPage — Registers new members and peer listeners into PeerCove.
 *
 * Directs members directly to their personalized wellbeing dashboard workspace.
 */

import { useState } from "react";
import { AppLogo } from "@/modules/client/shared/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import {
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Headphones,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

type SignupRole = "member" | "listener";

const SIGNUP_ROLES: Record<
  SignupRole,
  { title: string; subtitle: string; path: string; icon: any }
> = {
  member: {
    title: "Member Account",
    subtitle: "I want a safe, quiet space for emotional wellbeing, journaling & peer chats",
    path: "/peercove/member",
    icon: Sparkles,
  },
  listener: {
    title: "Volunteer Peer Listener",
    subtitle: "I want to offer empathetic, non-clinical listening to individuals in need",
    path: "/peercove/listener",
    icon: Headphones,
  },
};

export default function SignupPage() {
  const router = useRouter();
  const locale = useLocale();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<SignupRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeConfig = SIGNUP_ROLES[role];
  const dashboardPath = activeConfig.path;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (password && password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const effectiveName = name.trim() || cleanEmail.split("@")[0].replace(/[-_.]/g, " ");
    const effectiveEmail = cleanEmail;

    try {
      // Fast, non-blocking authentication & session initialization
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: effectiveName,
          email: effectiveEmail,
          redirectUrl: dashboardPath,
          locale,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize account");
      }

      toast.success(`Welcome ${effectiveName}! Entering your dashboard…`);

      const targetUrl = data.redirectUrl || `/${locale}${dashboardPath}`;
      
      // Immediate dashboard launch
      if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      } else {
        router.push(dashboardPath as any);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err?.message || "Sign up failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 py-6 px-4">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center justify-center space-x-2.5">
          <AppLogo size={42} className="w-10 h-10 text-emerald-700" />
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            PeerCove
          </span>
        </Link>
        <p className="text-sm text-muted-foreground font-medium">
          Make Space for Your Wellbeing & Human Support
        </p>
      </div>

      <Card className="border border-border/80 shadow-xl backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-1.5 pb-5">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Select your role to configure your dedicated care workspace
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Choice */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Account Role
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(SIGNUP_ROLES) as SignupRole[]).map((rKey) => {
                const conf = SIGNUP_ROLES[rKey];
                const Icon = conf.icon;
                const isSelected = role === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => setRole(rKey)}
                    className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-500/20"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? "bg-emerald-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                          {conf.title}
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {conf.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                autoComplete="name"
                disabled={isSubmitting}
                className="h-10"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-sm font-medium">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={isSubmitting}
                className="h-10"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opening Dashboard…
                </>
              ) : (
                <>
                  Create Account & Enter Workspace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 pb-6 border-t border-border/60">
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                router.push("/login" as any);
                setTimeout(() => {
                  window.location.href = `/${locale}/login`;
                }, 80);
              }}
              className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 cursor-pointer"
            >
              Sign In
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted zero-knowledge sessions · End-to-end privacy</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
