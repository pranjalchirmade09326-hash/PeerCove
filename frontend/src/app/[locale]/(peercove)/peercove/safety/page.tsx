import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function SafetyAliasOverviewPage() {
  await enforcePeerCoveRoleAccess("safety");
  const overviewData = await loadRoleOverviewData("safety");
  return (
    <PeerCoveRoleDashboard
      roleId="safety-operations"
      overviewData={overviewData}
    />
  );
}
