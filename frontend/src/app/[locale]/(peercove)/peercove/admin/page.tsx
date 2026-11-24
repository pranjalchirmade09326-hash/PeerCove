import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function AdminAliasOverviewPage() {
  await enforcePeerCoveRoleAccess("admin");
  const overviewData = await loadRoleOverviewData("admin");
  return (
    <PeerCoveRoleDashboard
      roleId="platform-administrator"
      overviewData={overviewData}
    />
  );
}
