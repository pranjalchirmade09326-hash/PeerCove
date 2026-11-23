"use client";

import React from "react";
import { useServerWake } from "@/hooks/useServerWake";
import { Loader2, CloudLightning } from "lucide-react";

export function ServerColdStartBanner() {
  const { isWaking } = useServerWake();

  if (!isWaking) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl bg-background/95 border border-border/80 px-4 py-2.5 shadow-xl backdrop-blur-md text-xs text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Loader2 className="size-4 animate-spin text-emerald-600" />
      <div className="flex flex-col">
        <span className="font-medium flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
          <CloudLightning className="size-3.5 text-emerald-600" />
          Connecting to Cloud Server
        </span>
        <span className="text-[11px] text-muted-foreground">
          Waking up free-tier backend... will be ready in a moment
        </span>
      </div>
    </div>
  );
}
