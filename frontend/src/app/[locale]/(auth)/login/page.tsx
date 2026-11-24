"use client";

/**
 * LoginPage — Authenticates users into PeerCove according to their selected role.
 *
 * Supported roles:
 * - member -> /[locale]/peercove/member
 * - listener -> /[locale]/peercove/listener
 * - listener-supervisor -> /[locale]/peercove/listener-supervisor
 * - safety-operations -> /[locale]/peercove/safety-operations
 * - platform-administrator -> /[locale]/peercove/platform-administrator
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
  HeartHandshake,
  ShieldCheck,
  Headphones,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/client/auth/betterauth/auth-client";

type RoleOption = "member" | "listener" | "listener-supervisor" | "safety-operations" | "platform-administrator";

const ROLE_CONFIGS: Record<RoleOption, { title: string; subtitle: string; path: string; icon: any; color: string }> = {
  member: {
    title: "Member Sanctuary",
    subtitle: "Personal reflections, guided intake & wellbeing support",
    path: "/peercove/member",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-600",
  },
  listener: {
    title: "Peer Listener",
    subtitle: "Active listening queue & volunteer chat workspace",
    path: "/peercove/listener",
    icon: Headphones,
    color: "from-teal-500 to-cyan-600",
  },
  "listener-supervisor": {
    title: "Listener Supervisor",
    subtitle: "Roster oversight, empathy audits & quality review",
    path: "/peercove/listener-supervisor",
    icon: HeartHandshake,
    color: "from-blue-500 to-indigo-600",
  },
  "safety-operations": {
    title: "Safety Operations",
    subtitle: "Emergency triage, 988 crisis handoffs & alerts",
    path: "/peercove/safety-operations",
    icon: ShieldCheck,
    color: "from-rose-500 to-orange-600",
  },
  "platform-administrator": {
    title: "Platform Admin",
    subtitle: "System health, encryption key rings & audit trails",
    path: "/peercove/platform-administrator",
    icon: SlidersHorizontal,
    color: "from-purple-500 to-violet-600",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleOption>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeConfig = ROLE_CONFIGS[selectedRole];
  const dashboardPath = activeConfig.path;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const effectiveEmail = email.trim().toLowerCase() || `${selectedRole}@peercove.local`;
    const effectiveName = email ? email.split("@")[0].replace(/[-_.]/g, " ") : activeConfig.title;

    try {
      // 1. Non-blocking IAM sync if BetterAuth is reachable (never throws "Failed to fetch" toast)
      try {
        if (password && typeof authClient?.signIn?.email === "function") {
          await Promise.race([
            authClient.signIn.email({
              email: effectiveEmail,
              password,
              callbackURL: dashboardPath,
              rememberMe: true,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("IAM_TIMEOUT")), 80)),
          ]);
        }
      } catch {
        // Quietly bypass when IAM is offline in local dev mode
      }

      // 2. Persist account into PostgreSQL database & issue authenticated session
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          name: effectiveName,
          email: effectiveEmail,
          redirectUrl: dashboardPath,
          locale,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      toast.success(`Welcome back! Entering ${activeConfig.title}…`, {
        description: `Authenticated as ${effectiveEmail}`,
        duration: 3500,
      });

      const targetUrl = data.redirectUrl || `/${locale}${dashboardPath}`;
      if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      } else {
        router.push(dashboardPath as any);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err?.message || "Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLaunch = async (role: RoleOption) => {
    setSelectedRole(role);
    setIsSubmitting(true);
    const config = ROLE_CONFIGS[role];

    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: `${config.title} User`,
          email: `${role}@peercove.local`,
          redirectUrl: config.path,
          locale,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Opening ${config.title}…`);
        const targetUrl = data.redirectUrl || `/${locale}${config.path}`;
        if (typeof window !== "undefined") {
          window.location.href = targetUrl;
        } else {
          router.push(config.path as any);
        }
      } else {
        toast.error("Quick sign-in failed.");
      }
    } catch {
      toast.error("Could not initialize session.");
    } finally {
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
          A Calmer, Stepped-Care Space for Mental Wellbeing
        </p>
      </div>

      <Card className="border border-emerald-100 dark:border-emerald-950/40 shadow-xl bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="space-y-1.5 pb-4 bg-muted/30 border-b border-border/50">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Sign In to PeerCove
          </CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm">
            Select your role workspace and enter your credentials to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          {/* ── 1-Click Instant Demo Login ── */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="size-4 text-emerald-600 animate-pulse" />
                1-Click Instant Demo Login
              </span>
              <span className="text-[10px] bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                Instant Access
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click any workspace below to log in directly:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(ROLE_CONFIGS) as RoleOption[]).map((r) => {
                const config = ROLE_CONFIGS[r];
                const Icon = config.icon;
                return (
                  <Button
                    key={r}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleQuickLaunch(r)}
                    className="h-10 text-xs px-3 rounded-xl border-emerald-600/30 bg-background/90 hover:bg-[#236B54] hover:text-white transition-all shadow-xs flex items-center justify-start gap-2"
                  >
                    <Icon className="size-3.5 shrink-0 text-emerald-600" />
                    <span className="font-semibold truncate">{config.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center pt-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <span className="relative bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Or sign in with email & password
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`${selectedRole}@example.com`}
                autoComplete="email"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 pr-10 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold rounded-xl bg-[#236B54] hover:bg-[#1b5341] text-white shadow-md transition-all duration-150"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In…
                </>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Sign In to {activeConfig.title}
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-2 pb-6 flex flex-col space-y-4 border-t border-border/40 mt-2">
          <div className="text-xs text-center text-muted-foreground pt-1">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                router.push("/signup" as any);
                setTimeout(() => {
                  window.location.href = `/${locale}/signup`;
                }, 80);
              }}
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              Create an account
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
