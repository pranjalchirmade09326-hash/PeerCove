import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function AdminOverviewPage() {
  await enforcePeerCoveRoleAccess("platform-administrator");
  const overviewData = await loadRoleOverviewData("platform-administrator");
  return (
    <PeerCoveRoleDashboard
      roleId="platform-administrator"
      overviewData={overviewData}
    />
  );
}
