import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function SupervisorOverviewPage() {
  await enforcePeerCoveRoleAccess("listener-supervisor");
  const overviewData = await loadRoleOverviewData("listener-supervisor");
  return (
    <PeerCoveRoleDashboard
      roleId="listener-supervisor"
      overviewData={overviewData}
    />
  );
}
