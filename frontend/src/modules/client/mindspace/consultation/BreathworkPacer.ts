import { useState, useEffect, useRef, useCallback } from "react";
import type { BreathPhase, BreathworkStatus } from "./types";

/**
 * Deterministic Somatic 4-7-8 Breathwork Pacer State Machine.
 * Cycle: Inhale (4s) -> Hold (7s) -> Exhale (8s) -> repeat.
 *
 * Single-timer tick mechanism eliminates timer drift and race conditions.
 */
export class BreathworkPacer {
  private isActive: boolean = false;
  private phase: BreathPhase = "Inhale";
  private secondsRemaining: number = 4;
  private completedCycles: number = 0;

  constructor(autoStart: boolean = false) {
    if (autoStart) {
      this.start();
    }
  }

  public start(): void {
    this.isActive = true;
    this.phase = "Inhale";
    this.secondsRemaining = 4;
  }

  public pause(): void {
    this.isActive = false;
  }

  public resume(): void {
    this.isActive = true;
  }

  public toggle(): void {
    this.isActive = !this.isActive;
  }

  public reset(): void {
    this.isActive = false;
    this.phase = "Inhale";
    this.secondsRemaining = 4;
    this.completedCycles = 0;
  }

  public getStatus(): BreathworkStatus {
    return {
      isActive: this.isActive,
      phase: this.phase,
      secondsRemaining: this.secondsRemaining,
      completedCycles: this.completedCycles,
    };
  }

  public tick(): void {
    if (!this.isActive) return;

    if (this.secondsRemaining > 1) {
      this.secondsRemaining -= 1;
    } else {
      // Phase transition: Inhale (4s) -> Hold (7s) -> Exhale (8s) -> Inhale
      if (this.phase === "Inhale") {
        this.phase = "Hold";
        this.secondsRemaining = 7;
      } else if (this.phase === "Hold") {
        this.phase = "Exhale";
        this.secondsRemaining = 8;
      } else if (this.phase === "Exhale") {
        this.phase = "Inhale";
        this.secondsRemaining = 4;
        this.completedCycles += 1;
      }
    }
  }
}

/**
 * React hook wrapping the deterministic 4-7-8 BreathworkPacer
 */
export function useBreathworkPacer(autoStart: boolean = false) {
  const pacerRef = useRef<BreathworkPacer | null>(null);
  if (!pacerRef.current) {
    pacerRef.current = new BreathworkPacer(autoStart);
  }

  const [status, setStatus] = useState<BreathworkStatus>(() =>
    pacerRef.current!.getStatus()
  );

  const start = useCallback(() => {
    pacerRef.current?.start();
    setStatus(pacerRef.current!.getStatus());
  }, []);

  const pause = useCallback(() => {
    pacerRef.current?.pause();
    setStatus(pacerRef.current!.getStatus());
  }, []);

  const resume = useCallback(() => {
    pacerRef.current?.resume();
    setStatus(pacerRef.current!.getStatus());
  }, []);

  const toggle = useCallback(() => {
    pacerRef.current?.toggle();
    setStatus(pacerRef.current!.getStatus());
  }, []);

  const reset = useCallback(() => {
    pacerRef.current?.reset();
    setStatus(pacerRef.current!.getStatus());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (pacerRef.current) {
        pacerRef.current.tick();
        setStatus(pacerRef.current.getStatus());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    ...status,
    start,
    pause,
    resume,
    toggle,
    reset,
  };
}
