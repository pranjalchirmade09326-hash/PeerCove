import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getPeerCoveAuthSession } from "@/modules/server/peercove/api-client";
import { enforcePeerCoveRoleAccess } from "@/modules/server/peercove/role-guard";
import { PeerCoveTextIntake } from "@/modules/client/peercove/intake/PeerCoveTextIntake";

export default async function MemberChatPage() {
  await enforcePeerCoveRoleAccess("member");

  const session = await getPeerCoveAuthSession();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const basePath = `/${locale}/peercove/member`;

  return (
    <PeerCoveTextIntake
      locale={locale}
      basePath={basePath}
      userName={session.name ?? "Member"}
    />
  );
}
