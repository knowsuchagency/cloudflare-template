import { Nav } from "@/components/marketing/nav"
import { Hero } from "@/components/marketing/hero"
import { FeatureRow } from "@/components/marketing/feature-row"
import { Footer } from "@/components/marketing/footer"

export function Landing() {
  return (
    <div className="relative">
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-14">
        <Nav />
        <Hero />
        <FeatureRow />
        <Footer />
      </div>
    </div>
  )
}
