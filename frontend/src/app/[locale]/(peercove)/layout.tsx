import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getServerSession } from "@/modules/server/auth/get-session";
import AppNavbar from "@/modules/client/shared/components/navbar/AppNavbar";
import { PeerCoveSidebar } from "@/modules/client/peercove-dashboard/PeerCoveSidebar";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

const PeerCoveLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const role =
    (session.user as { role?: string | null })?.role ||
    session.session?.activeRole ||
    "member";

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    username: session.user.username,
    role,
    activeOrganizationId: session.session?.activeOrganizationId ?? null,
  };

  const apps = (session.session as { apps?: unknown[] } | undefined)?.apps ?? [];

  return (
    <SidebarProvider>
      <PeerCoveSidebar user={user} />
      <SidebarInset className="min-w-0 h-dvh overflow-hidden">
        <AppNavbar user={user} apps={apps} />
        <main className="flex-1 min-h-0 overflow-y-auto mx-auto px-4 pb-4 max-w-[110rem] space-y-6 w-full">
          <div className="w-full">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PeerCoveLayout;
