import { Nav } from "@/components/marketing/nav"
import { Hero } from "@/components/marketing/hero"
import { Ticker } from "@/components/marketing/ticker"
import { FeatureRow } from "@/components/marketing/feature-row"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { StatsBand } from "@/components/marketing/stats-band"
import { SocialProof } from "@/components/marketing/social-proof"
import { PricingSection } from "@/components/marketing/pricing-section"
import { FaqSection } from "@/components/marketing/faq-section"
import { CtaBand } from "@/components/marketing/cta-band"
import { Footer } from "@/components/marketing/footer"

// Page order is a conversion funnel: value prop → proof → benefits → how it
// works → numbers → social proof → price → objections → final ask. Sections
// hide themselves when their slice of src/content/marketing.ts is empty.
export function Landing() {
  return (
    <div className="relative">
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-14">
        <Nav />
        <Hero />
        <Ticker />
        <FeatureRow />
        <HowItWorks />
        <StatsBand />
        <SocialProof />
        <PricingSection />
        <FaqSection />
        <CtaBand />
        <Footer />
      </div>
    </div>
  )
}
