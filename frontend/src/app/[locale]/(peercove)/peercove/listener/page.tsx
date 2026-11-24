import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function ListenerOverviewPage() {
  await enforcePeerCoveRoleAccess("listener");
  const overviewData = await loadRoleOverviewData("listener");
  return <PeerCoveRoleDashboard roleId="listener" overviewData={overviewData} />;
}
