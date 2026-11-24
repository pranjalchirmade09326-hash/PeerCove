"use client";

import {
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { AppLogo } from "@/modules/client/shared/components/AppLogo";
import { SidebarNavUser } from "@/modules/client/shared/components/SidebarNavUser";
import { dashboardRoles, getDashboardRole } from "./dashboard-data";

type SidebarUser = {
  name: string;
  email: string;
  role?: string | null;
  image?: string | null;
  username?: string | null;
};

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label}>
        <Link href={href} onClick={() => setOpenMobile(false)}>
          <Icon className="size-4" aria-hidden="true" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function PeerCoveTitle({ home, subtitle }: { home: string; subtitle: string }) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="hover:bg-transparent active:bg-transparent"
          asChild
        >
          <Link href={home} onClick={() => setOpenMobile(false)}>
            <AppLogo size={32} className="aspect-square size-8" />
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-bold">PeerCove</span>
              <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function PeerCoveSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const role = segments[0] === "peercove" ? getDashboardRole(segments[1] ?? "") : undefined;

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader>
        <PeerCoveTitle
          home={role ? `/peercove/${role.id}` : "/peercove"}
          subtitle={role ? `${role.shortTitle} workspace` : "Choose a workspace"}
        />
      </SidebarHeader>
      <SidebarContent>
        {!role && (
          <SidebarGroup>
            <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
            <SidebarMenu>
              {dashboardRoles.map((item) => (
                <SidebarLink
                  key={item.id}
                  href={`/peercove/${item.id}`}
                  label={item.title}
                  icon={item.icon}
                  active={segments[1] === item.id}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {role && (
          <SidebarGroup>
            <SidebarGroupLabel>{role.shortTitle} workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarLink
                href={`/peercove/${role.id}`}
                label="Overview"
                icon={LayoutDashboard}
                active={pathname === `/peercove/${role.id}`}
              />
              {role.sections.map((section) => (
                <SidebarLink
                  key={section.id}
                  href={`/peercove/${role.id}/${section.id}`}
                  label={section.title}
                  icon={section.icon}
                  active={pathname === `/peercove/${role.id}/${section.id}`}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
