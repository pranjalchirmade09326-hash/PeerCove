"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { AppLogo } from "@/modules/client/shared/components/AppLogo";

export function AppTitle() {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="hover:bg-transparent active:bg-transparent"
          asChild
        >
          <Link href="/peercove" onClick={() => setOpenMobile(false)}>
            <AppLogo size={32} className="aspect-square size-8" />
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-bold">PeerCove</span>
              <span className="truncate text-xs text-muted-foreground">
                Your care space
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
