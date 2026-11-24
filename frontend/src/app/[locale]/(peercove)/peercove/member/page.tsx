import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function MemberOverviewPage() {
  await enforcePeerCoveRoleAccess("member");
  const overviewData = await loadRoleOverviewData("member");
  return <PeerCoveRoleDashboard roleId="member" overviewData={overviewData} />;
}

