import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function SafetyOperationsOverviewPage() {
  await enforcePeerCoveRoleAccess("safety-operations");
  const overviewData = await loadRoleOverviewData("safety-operations");
  return (
    <PeerCoveRoleDashboard
      roleId="safety-operations"
      overviewData={overviewData}
    />
  );
}
