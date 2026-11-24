import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function SupervisorAliasOverviewPage() {
  await enforcePeerCoveRoleAccess("supervisor");
  const overviewData = await loadRoleOverviewData("supervisor");
  return (
    <PeerCoveRoleDashboard
      roleId="listener-supervisor"
      overviewData={overviewData}
    />
  );
}
