import { PeerCoveRoleSection } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleSectionData } from "@/modules/server/peercove/role-dashboards";

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforcePeerCoveRoleAccess("platform-administrator");
  const sectionData = await loadRoleSectionData("platform-administrator", section);
  return (
    <PeerCoveRoleSection
      roleId="platform-administrator"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}
