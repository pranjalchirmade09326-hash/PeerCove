import { PeerCoveRoleSection } from "@/modules/client/peercove-dashboard/PeerCovePortal";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { loadRoleSectionData } from "@/modules/server/peercove/role-dashboards";

export default async function MemberSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await enforcePeerCoveRoleAccess("member");
  const sectionData = await loadRoleSectionData("member", section);
  return (
    <PeerCoveRoleSection
      roleId="member"
      sectionId={section}
      sectionData={sectionData}
    />
  );
}

