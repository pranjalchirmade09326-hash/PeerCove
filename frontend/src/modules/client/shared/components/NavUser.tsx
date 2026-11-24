"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/modules/client/auth/betterauth/auth-client";
import { LogOut, Settings2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type TUser = {
  name: string;
  email: string;
  role?: string | null;
  image?: string | null;
  username?: string | null;
};

export type NavUserProps = {
  user?: TUser;
  name?: string;
  email?: string;
  role?: string | null;
  image?: string | null;
  username?: string | null;
};

export function NavUser(props: NavUserProps) {
  const user = props.user || (props as TUser);
  const { name = "", email = "", image, username, role } = user;

  const initials = (name ?? "U")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const rLower = (role ?? "").toLowerCase();
  const displayRole =
    rLower === "patient" || rLower === "member"
      ? "Member"
      : rLower === "doctor" || rLower === "listener"
      ? "Listener"
      : rLower === "admin" || rLower === "platform-administrator"
      ? "Administrator"
      : role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "Member";

  const settingsHref =
    rLower === "patient" || rLower === "member"
      ? "/peercove/member/profile"
      : rLower === "doctor" || rLower === "listener"
      ? "/peercove/listener/profile"
      : "/peercove/member/profile";

  async function handleLogout() {
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    try {
      await fetch("/api/auth/dev-logout", { method: "POST" });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("member_auth_token");
      document.cookie = "peercove_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "dev_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "activeRoleRedirectUrl=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    } catch {
      // ignore
    }
    window.location.href = "/en/login";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-accent focus:outline-none cursor-pointer"
        >
          <div className="hidden sm:flex flex-col items-end text-right leading-tight">
            <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
              {name}
            </span>
            <span className="badge text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize font-medium leading-normal">
              {displayRole}
            </span>
          </div>
          <Avatar className="cursor-pointer size-9">
            <AvatarImage src={image ?? undefined} />
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={10}
        className="min-w-56"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2.5">
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={image ?? undefined} />
              <AvatarFallback className="text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground">
                  {name}
                  {username ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      @{username}
                    </span>
                  ) : null}
                </p>
                <span className="badge text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize font-medium">
                  {displayRole}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={settingsHref}
            className="flex items-center gap-2 w-full"
          >
            <Settings2 className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
