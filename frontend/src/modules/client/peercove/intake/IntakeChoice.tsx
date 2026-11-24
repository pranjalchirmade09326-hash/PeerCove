import { Link } from "@/i18n/navigation";
import { ArrowRight, Clock3, MessageCircle, Mic, ShieldCheck } from "lucide-react";

const intakeOptions = [
  {
    href: "/intake/chat",
    title: "Chat with us",
    description:
      "Share what is on your mind by typing. Take your time and answer at your own pace.",
    detail: "Text conversation",
    detailIcon: ShieldCheck,
    icon: MessageCircle,
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  },
  {
    href: "/intake/voice",
    title: "Talk it through",
    description:
      "Use your voice for a guided conversation. You can pause or end the session whenever you need.",
    detail: "Voice-guided conversation",
    detailIcon: Clock3,
    icon: Mic,
    tone: "bg-sky-50 text-sky-800 ring-sky-100",
  },
] as const;

export function IntakeChoice() {
  return (
    <section className="mx-auto max-w-5xl space-y-8 py-4">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-800">
          Your care, your pace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          How would you like to begin?
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Choose chat or voice for your intake. There is no need to have the
          perfect words ready; start wherever you are.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {intakeOptions.map((option) => {
          const Icon = option.icon;
          const DetailIcon = option.detailIcon;
          return (
            <Link
              key={option.title}
              href={option.href}
              className="group flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg sm:p-8"
            >
              <span
                className={`mb-6 flex size-14 items-center justify-center rounded-2xl ring-1 ${option.tone}`}
              >
                <Icon className="size-6" />
              </span>
              <h2 className="text-xl font-semibold text-slate-900">
                {option.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {option.description}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <DetailIcon className="size-4" />
                  {option.detail}
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  Continue
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        If you are in immediate danger or need emergency help, contact your
        local emergency services.
      </p>
    </section>
  );
}
