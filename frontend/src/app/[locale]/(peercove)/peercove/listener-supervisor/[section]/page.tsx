import { PeerCoveRoleSection } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleSectionData } from "@/modules/server/peercove/role-dashboards";

export default async function SupervisorSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforcePeerCoveRoleAccess("listener-supervisor");
  const sectionData = await loadRoleSectionData("listener-supervisor", section);
  return (
    <PeerCoveRoleSection
      roleId="listener-supervisor"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}
