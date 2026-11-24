import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getPeerCoveAuthSession } from "@/modules/server/peercove/api-client";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { WellbeingCompanionChat } from "@/modules/client/peercove/companion/WellbeingCompanionChat";

export default async function MemberCompanionPage() {
  await enforcePeerCoveRoleAccess("member");

  const session = await getPeerCoveAuthSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const basePath = `/${locale}/peercove/member`;

  return (
    <WellbeingCompanionChat
      userName={session.name ?? "Member"}
      basePath={basePath}
    />
  );
}
