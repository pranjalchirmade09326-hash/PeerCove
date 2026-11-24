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
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { authClient } from "@/modules/client/auth/betterauth/auth-client";
import { ChevronsUpDown, LogOut, Settings2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type TUser = {
  name: string;
  email: string;
  role?: string | null;
  image?: string | null;
  username?: string | null;
};

export type SidebarNavUserProps = {
  user?: TUser;
  name?: string;
  email?: string;
  role?: string | null;
  image?: string | null;
  username?: string | null;
};

export function SidebarNavUser(props: SidebarNavUserProps) {
  const user = props.user || (props as TUser);
  const { name = "", email = "", image, username, role } = user;
  const { state } = useSidebar();

  const initials = (name ?? "U")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const rNorm = (role ?? "").toLowerCase().replace(/_/g, "-");
  const displayRole =
    rNorm === "patient" || rNorm === "member"
      ? "Member"
      : rNorm === "doctor" || rNorm === "listener"
      ? "Listener"
      : rNorm === "listener-supervisor" || rNorm === "supervisor"
      ? "Listener Supervisor"
      : rNorm === "safety-operations" || rNorm === "safety-operations-specialist" || rNorm === "safety"
      ? "Safety Specialist"
      : rNorm === "admin" || rNorm === "platform-administrator"
      ? "Administrator"
      : role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "Member";

  const settingsHref =
    rNorm === "patient" || rNorm === "member"
      ? "/peercove/member/profile"
      : rNorm === "doctor" || rNorm === "listener"
      ? "/peercove/listener/profile"
      : rNorm === "listener-supervisor" || rNorm === "supervisor"
      ? "/peercove/listener-supervisor"
      : rNorm === "safety-operations" || rNorm === "safety-operations-specialist" || rNorm === "safety"
      ? "/peercove/safety-operations"
      : rNorm === "platform-administrator" || rNorm === "admin"
      ? "/peercove/platform-administrator"
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
        <SidebarMenuButton
          size="lg"
          className={cn(
            "cursor-pointer",
            state === "expanded" &&
              "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
          )}
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={image ?? undefined} />
            <AvatarFallback className="rounded-lg text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate font-semibold">{name}</span>
              <span className="badge text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground capitalize font-medium shrink-0">
                {displayRole}
              </span>
            </div>
            <span className="truncate text-xs text-muted-foreground">
              {email}
            </span>
          </div>
          <ChevronsUpDown className="ms-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
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
                <span className="badge text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground capitalize font-medium">
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
