import { cn } from "@/lib/utils";

export function AppLogo({
  size = 32,
  className,
}: {
  /** Width/height in px. Default 32 (matches the main app sidebar's size-8 badge). */
  size?: number;
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="PeerCove"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="16" fill="#E8F4EE" />
      <path
        d="M24 10.5c-1.6 5.7-5.8 9.9-11.5 11.5 5.7 1.6 9.9 5.8 11.5 11.5 1.6-5.7 5.8-9.9 11.5-11.5-5.7-1.6-9.9-5.8-11.5-11.5Z"
        fill="#236B54"
      />
      <circle cx="24" cy="23" r="3.2" fill="#F7FAF8" />
    </svg>
  );
}
