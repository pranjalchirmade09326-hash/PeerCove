import { PeerCoveRoleSection } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleSectionData } from "@/modules/server/peercove/role-dashboards";

export default async function ListenerSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforcePeerCoveRoleAccess("listener");
  const sectionData = await loadRoleSectionData("listener", section);
  return (
    <PeerCoveRoleSection
      roleId="listener"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}
