import LandingPage from "./landing"
import { Topbar } from "@/components/public/topbar"
import { Footer } from "@/components/public/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Topbar />
      <main className="flex-1">
        <LandingPage />
      </main>
      <Footer />
    </div>
  )
}
