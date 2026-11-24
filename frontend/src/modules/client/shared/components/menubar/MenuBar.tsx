"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { NavGroup } from "./NavGroup";
import { AppTitle } from "./AppTitle";
import { SidebarNavUser } from "../SidebarNavUser";
import { type NavGroup as NavGroupProps } from "./types";
import { settingsSidebarData, telemedicineSidebarData } from "./menu-datas";

type TUser = {
  name: string;
  email: string;
  role?: string | null;
  image?: string | null;
  username?: string | null;
  activeOrganizationId: string | null | undefined;
};

interface NavNode {
  id: string;
  label: string;
  slug: string;
  icon: string | null;
  href: string | null;
  type: string;
  isVisible: boolean;
  permissionKeys: string[];
  children: NavNode[];
}

interface ContextApp {
  id: string;
  name: string;
  slug: string;
  menus: NavNode[];
}

interface ContextResponse {
  apps: ContextApp[];
  permissions: string[];
}

function buildNavGroups(app: ContextApp): NavGroupProps[] {
  return app.menus
    .filter((node) => node.type === "GROUP" && node.isVisible)
    .map((group) => ({
      title: group.label,
      items: group.children
        .filter((child) => child.isVisible)
        .map((child) => {
          const visibleSubs = child.children.filter((sub) => sub.isVisible);
          if (child.type === "GROUP" || visibleSubs.length > 0) {
            return {
              title: child.label,
              icon: child.icon ?? undefined,
              items: (child.type === "GROUP" ? child.children : visibleSubs)
                .filter((sub) => sub.isVisible)
                .map((sub) => ({
                  title: sub.label,
                  url: sub.href ?? "#",
                  icon: sub.icon ?? undefined,
                })),
            };
          }
          return {
            title: child.label,
            url: child.href ?? "#",
            icon: child.icon ?? undefined,
          };
        }),
    }));
}

const patientIntakeLinks: NavGroupProps["items"] = [
  {
    title: "Choose an intake",
    url: "/peercove/member/intake",
    icon: "heart",
  },
  {
    title: "Chat intake",
    url: "/peercove/member/chat",
    icon: "message-circle",
  },
  {
    title: "Voice intake",
    url: "/peercove/member/voice",
    icon: "mic",
  },
];

function withPatientIntakeLinks(groups: NavGroupProps[]): NavGroupProps[] {
  const missingLinks = patientIntakeLinks.filter(
    (link) =>
      !groups.some((group) =>
        group.items.some(
          (item) =>
            ("url" in item && item.url === link.url) ||
            ("items" in item &&
              Array.isArray(item.items) &&
              item.items.some((subItem: any) => subItem.url === link.url)),
        ),
      ),
  );

  if (missingLinks.length === 0) return groups;

  const memberGroupIndex = groups.findIndex((group) =>
    group.title.toLowerCase().includes("member") ||
    group.title.toLowerCase().includes("patient"),
  );

  if (memberGroupIndex === -1) {
    return [...groups, { title: "Intake & Care", items: missingLinks }];
  }

  return groups.map((group, index) =>
    index === memberGroupIndex
      ? { ...group, items: [...group.items, ...missingLinks] }
      : group,
  );
}

function getRoleNavGroups(
  role: string | null | undefined,
  pathname?: string,
): NavGroupProps[] {
  const p = (pathname ?? "").toLowerCase();
  const normalizedRole = role?.toLowerCase() ?? "";
  const isListener =
    p.includes("/listener") ||
    p.includes("/doctor") ||
    normalizedRole.includes("doctor") ||
    normalizedRole.includes("listener");

  const isAdminOrOperations =
    p.includes("/admin") ||
    p.includes("/platform-administrator") ||
    p.includes("/listener-supervisor") ||
    p.includes("/safety-operations") ||
    normalizedRole.includes("admin") ||
    normalizedRole.includes("supervisor") ||
    normalizedRole.includes("safety");

  if (isAdminOrOperations) {
    return telemedicineSidebarData.navGroups.filter((group) =>
      group.title.toLowerCase().includes("administration"),
    ) as NavGroupProps[];
  }

  if (isListener) {
    return telemedicineSidebarData.navGroups.filter((group) =>
      group.title.toLowerCase().includes("listener"),
    ) as NavGroupProps[];
  }

  return telemedicineSidebarData.navGroups.filter((group) =>
    group.title.toLowerCase().includes("member"),
  ) as NavGroupProps[];
}

function normalizeNavGroups(
  groups: NavGroupProps[],
  role?: string | null,
  pathname?: string,
): NavGroupProps[] {
  const p = (pathname ?? "").toLowerCase();
  const r = role?.toLowerCase() ?? "";
  const isListener =
    p.includes("/listener") ||
    p.includes("/doctor") ||
    r.includes("doctor") ||
    r.includes("listener");

  return groups.map((group) => {
    const titleLower = group.title.toLowerCase();
    if (
      titleLower.includes("doctor") ||
      titleLower.includes("patient") ||
      titleLower.includes("portal")
    ) {
      return {
        ...group,
        title: isListener ? "Peer Listener Workspace" : "Member Sanctuary",
      };
    }
    return group;
  });
}

const SKELETON_COUNTS = [3, 2, 2, 1];

function NavSkeleton() {
  return (
    <>
      {SKELETON_COUNTS.map((count, gi) => (
        <SidebarGroup key={gi}>
          <SidebarGroupLabel>
            <Skeleton className="h-3 w-full bg-muted-foreground/25" />
          </SidebarGroupLabel>
          <SidebarMenu>
            {Array.from({ length: count }).map((_, ii) => (
              <SidebarMenuItem key={ii}>
                <SidebarMenuButton>
                  <Skeleton className="h-4 w-4 shrink-0 rounded bg-muted-foreground/25" />
                  <Skeleton className="h-4 flex-1 bg-muted-foreground/25" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

export function MenuBar(user: TUser) {
  const [allApps, setAllApps] = useState<ContextApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const isSettings = pathname.includes("/settings");
  const currentSlug =
    segments.find((s) => s === "telemedicine" || s === "settings") ??
    (segments[1] ?? "");

  const currentApp = allApps.find((a) => a.slug === currentSlug);
  const roleGroups = getRoleNavGroups(user.role, pathname);
  const baseNavGroups: NavGroupProps[] = isSettings
    ? (settingsSidebarData.navGroups as NavGroupProps[])
    : currentApp && buildNavGroups(currentApp).length > 0
      ? normalizeNavGroups(buildNavGroups(currentApp), user.role, pathname)
      : roleGroups;
  const isMemberWorkspace =
    pathname.includes("/telemedicine/patient") ||
    pathname.includes("/peercove/member");
  const navGroups =
    !isSettings && isMemberWorkspace
      ? withPatientIntakeLinks(baseNavGroups)
      : baseNavGroups;

  useEffect(() => {
    let isSubscribed = true;
    const base = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    if (!base) {
      setAllApps([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600);
    const orgId = user.activeOrganizationId;
    const url = orgId
      ? `${base}/api/me/context?organizationId=${orgId}`
      : `${base}/api/me/context`;

    fetch(url, { credentials: "include", signal: controller.signal })
      .then(async (res): Promise<ContextResponse> => {
        if (!res.ok) return { apps: [], permissions: [] };
        return (await res.json()) as ContextResponse;
      })
      .then((data) => {
        if (isSubscribed) {
          setAllApps(data?.apps ?? []);
        }
      })
      .catch((err) => {
        if (isSubscribed && err?.name !== "AbortError") {
          setAllApps([]);
        }
      })
      .finally(() => {
        clearTimeout(timer);
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [user.activeOrganizationId]);

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {!isSettings && isLoading ? (
          <NavSkeleton />
        ) : (
          navGroups.map((props) => <NavGroup key={props.title} {...props} />)
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
