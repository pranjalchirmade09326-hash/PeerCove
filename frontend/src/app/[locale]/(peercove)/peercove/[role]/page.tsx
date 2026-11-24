import { PeerCoveRoleDashboard } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleOverviewData } from "@/modules/server/peercove/role-dashboards";

export default async function PeerCoveRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  await enforcePeerCoveRoleAccess(role);
  const overviewData = await loadRoleOverviewData(role);
  return <PeerCoveRoleDashboard roleId={role} overviewData={overviewData} />;
}
