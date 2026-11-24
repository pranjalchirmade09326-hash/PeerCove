/**
 * Marketing landing page for PeerCove.
 *
 * Route: /[locale]/(marketing)
 *
 * Server component. Fetches the current session to control CTA button
 * variants (Sign Up vs. Open Dashboard). Composes the full public-facing
 * landing page:
 *
 *   RootNavbar  — PeerCove navigation and account actions
 *   Hero        — welcoming patient-first introduction and intake preview
 *   Features    — ways to begin and continue care
 *   HowItWorks  — three-step patient journey
 *   Testimonials — patient-centered reassurance and safety note
 *   Cta         — sign-up call to action
 *   Footer      — product and information links
 */

import { getServerSession } from "@/modules/server/auth/get-session";
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Hero from "@/modules/client/(marketing)/components/Hero";
import Features from "@/modules/client/(marketing)/components/Features";
import HowItWorks from "@/modules/client/(marketing)/components/HowItWorks";
import Testimonials from "@/modules/client/(marketing)/components/Testimonials";
import Cta from "@/modules/client/(marketing)/components/Cta";
import DemoAccessSection from "@/modules/client/(marketing)/components/DemoAccessSection";
import Footer from "@/modules/client/(marketing)/components/Footer";

export const dynamic = "force-dynamic";

/** Marketing landing page. */
export default async function Home() {
  const session = await getServerSession();

  return (
    <>
      <RootNavbar session={session} />
      <main>
        <Hero session={session} />
        <Features />
        <DemoAccessSection />
        <HowItWorks />
        <Testimonials />
        <Cta session={session} />
      </main>
      <Footer />
    </>
  );
}
