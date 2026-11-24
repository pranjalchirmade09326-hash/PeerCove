import { PeerCoveRoleSection } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleSectionData } from "@/modules/server/peercove/role-dashboards";

export default async function PeerCoveRoleSectionPage({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  const { role, section } = await params;
  await enforcePeerCoveRoleAccess(role);
  const sectionData = await loadRoleSectionData(role, section);
  return <PeerCoveRoleSection roleId={role} sectionId={section} sectionData={sectionData} />;
}
