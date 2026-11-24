/**
 * Demo Login Component
 * Provides quick access to demo user accounts for testing different roles
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, Check } from "lucide-react";

interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: "member" | "listener" | "listener-supervisor" | "safety-operations" | "platform-administrator";
  description: string;
  avatar: string;
  color: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "member@demo.com",
    password: "demo123456",
    name: "Sarah Chen",
    role: "member",
    description: "Member with 15 journal entries & 7-day streak",
    avatar: "👩‍💼",
    color: "from-emerald-500 to-teal-600",
  },
  {
    email: "member2@demo.com",
    password: "demo123456",
    name: "Alex Rivera",
    role: "member",
    description: "Member with 8 journal entries & 4-day streak",
    avatar: "🧑‍💼",
    color: "from-emerald-500 to-teal-600",
  },
  {
    email: "listener@demo.com",
    password: "demo123456",
    name: "Marcus Johnson",
    role: "listener",
    description: "Listener with 4.8★ rating & 42 conversations",
    avatar: "🎧",
    color: "from-cyan-500 to-blue-600",
  },
  {
    email: "listener2@demo.com",
    password: "demo123456",
    name: "Emma Williams",
    role: "listener",
    description: "Listener with 4.9★ rating & 58 conversations",
    avatar: "🎧",
    color: "from-cyan-500 to-blue-600",
  },
  {
    email: "supervisor@demo.com",
    password: "demo123456",
    name: "Rae Kim",
    role: "listener-supervisor",
    description: "Listener Supervisor overseeing pod quality & audits",
    avatar: "🧭",
    color: "from-blue-500 to-indigo-600",
  },
  {
    email: "safety@demo.com",
    password: "demo123456",
    name: "Noor Haddad",
    role: "safety-operations",
    description: "Safety Operations Specialist managing crisis triage",
    avatar: "🛡️",
    color: "from-amber-500 to-red-600",
  },
  {
    email: "admin@demo.com",
    password: "demo123456",
    name: "Platform Administrator",
    role: "platform-administrator",
    description: "Administrator access to platform, telemetry & audits",
    avatar: "👨‍💻",
    color: "from-purple-500 to-pink-600",
  },
];

interface DemoLoginComponentProps {
  onLoginStart?: () => void;
  onLoginComplete?: (role: string) => void;
}

export const DemoLoginComponent: React.FC<DemoLoginComponentProps> = ({
  onLoginStart,
  onLoginComplete,
}) => {
  const router = useRouter();
  const [selectedAccount, setSelectedAccount] = useState<DemoAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleDemoLogin = async (account: DemoAccount) => {
    setIsLoading(true);
    setError(null);
    onLoginStart?.();

    try {
      // Store demo credentials in localStorage for quick access
      localStorage.setItem("userId", `demo-${account.role}`);
      localStorage.setItem("userRole", account.role);
      localStorage.setItem("displayName", account.name);
      localStorage.setItem("isDemoMode", "true");

      // Establish authenticated peercove_session cookie for server components
      try {
        await fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: `demo-${account.role}`,
            email: account.email,
            role: account.role,
            name: account.name,
          }),
        });
      } catch (authErr) {
        console.warn("Dev login cookie set error:", authErr);
      }

      // Simulate brief login transition
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Redirect to appropriate dashboard
      const dashboardPath =
        account.role === "member"
          ? "/peercove/member"
          : account.role === "listener"
            ? "/peercove/listener"
            : account.role === "listener-supervisor"
              ? "/peercove/listener-supervisor"
              : account.role === "safety-operations"
                ? "/peercove/safety-operations"
                : "/peercove/platform-administrator";

      onLoginComplete?.(account.role);
      router.push(dashboardPath);
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      console.error("Demo login error:", err);
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, email: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">🎭 Demo Access</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Quick sign-in with pre-configured demo accounts to explore PeerCove
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_ACCOUNTS.map((account) => (
          <Card
            key={account.email}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedAccount?.email === account.email
                ? "ring-2 ring-primary"
                : ""
            }`}
            onClick={() => setSelectedAccount(account)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{account.avatar}</div>
                  <div>
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {account.role.charAt(0).toUpperCase() + account.role.slice(1)}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {account.description}
              </p>

              <div className="space-y-2 bg-muted p-2 rounded-md text-sm font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Email:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{account.email}</code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(account.email, account.email);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedEmail === account.email ? (
                        <Check size={14} className="inline" />
                      ) : (
                        <Copy size={14} className="inline" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Password:
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{account.password}</code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(account.password, account.email);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedEmail === account.email ? (
                        <Check size={14} className="inline" />
                      ) : (
                        <Copy size={14} className="inline" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDemoLogin(account);
                }}
                disabled={isLoading}
                className={`w-full bg-gradient-to-r ${account.color}`}
              >
                {isLoading && selectedAccount?.email === account.email ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  `Sign in as ${account.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          💡 <strong>Tip:</strong> Click any account card to select it, then click
          the sign-in button. All demo credentials are pre-populated and ready to use.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DemoLoginComponent;
