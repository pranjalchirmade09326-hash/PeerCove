import { AppLogo } from "@/modules/client/shared/components/AppLogo";
import { Link } from "@/i18n/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-[#f7faf8] lg:grid lg:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.1fr)]">
      <aside className="relative hidden min-h-svh overflow-hidden bg-[#eaf5ef] px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute -left-32 top-20 size-96 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-sky-200/40 blur-3xl" />
        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3">
          <AppLogo size={42} className="size-10 text-emerald-800" />
          <span className="text-xl font-semibold tracking-tight text-slate-950">
            PeerCove
          </span>
        </Link>

        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-800">
            Make room for how you feel
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-950 xl:text-5xl">
            Your wellbeing deserves a space of its own.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
            Start with a guided chat or voice conversation. Move at your own
            pace, and find your appointments and care details together.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="rounded-full border border-emerald-200 bg-white/70 px-4 py-2">
              Chat at your pace
            </span>
            <span className="rounded-full border border-emerald-200 bg-white/70 px-4 py-2">
              Choose voice
            </span>
            <span className="rounded-full border border-emerald-200 bg-white/70 px-4 py-2">
              Keep care together
            </span>
          </div>
        </div>

        <p className="relative z-10 text-sm text-slate-500">
          Your care journey is yours to shape.
        </p>
      </aside>

      <main className="flex min-h-svh items-center justify-center px-4 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}
