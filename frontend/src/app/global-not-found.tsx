import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const dmSans = { className: "" };

export const metadata: Metadata = {
  title: "Page Not Found | PeerCove",
  description: "The page you are looking for does not exist.",
};

/** Static global 404 page — no locale, session, or provider context available here. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={dmSans.className}>
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Page not found</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              The page you&apos;re looking for doesn&apos;t exist or may have
              been moved.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </body>
    </html>
  );
}
