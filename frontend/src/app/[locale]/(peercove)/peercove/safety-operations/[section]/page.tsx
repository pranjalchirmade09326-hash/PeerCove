import { PeerCoveRoleSection } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleSectionData } from "@/modules/server/peercove/role-dashboards";

export default async function SafetyOperationsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforcePeerCoveRoleAccess("safety-operations");
  const sectionData = await loadRoleSectionData("safety-operations", section);
  return (
    <PeerCoveRoleSection
      roleId="safety-operations"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}
