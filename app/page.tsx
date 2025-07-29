import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Bell, Gauge } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CityAir+</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Home
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#benefits" className="text-sm font-medium hover:text-primary">
              Benefits
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Admin Dashboard</Button>
            </Link>
            <Link href="/public-monitor">
              <Button>View Live Air Quality</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Monitor Air Quality & Combat Climate Change in Your City
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Real-time monitoring, advanced analytics, instant alerts and real-time display for maintaining optimal air quality in
                    your city.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/public-monitor">
                    <Button size="lg" className="gap-1">
                      View Live Air Quality <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-[350px] sm:h-[400px] sm:w-[400px] lg:h-[500px] lg:w-[500px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full opacity-20 blur-3xl"></div>
                  {/* Using your actual image from public/image.png */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-xl">
                    <Image
                      src="/image.png"
                      alt="CityAir+ Dashboard Preview - Real-time Air Quality Monitoring"
                      width={500}
                      height={500}
                      className="rounded-lg object-cover w-full h-full"
                      priority
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {/* Optional overlay with branding - you can remove this if you don't want it */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Gauge className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">CityAir+</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Real-time Environmental Monitoring</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  CityAir+ provides comprehensive tools to monitor and improve air quality in urban
                  environments.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-4">
                  <Gauge className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Real-time Environmental Monitoring</h3>
                <p className="text-center text-muted-foreground">
                  Track carbon monoxide, air quality, temperature, and humidity with our MQ-9, MQ-135, and DHT-11 sensors for instant environmental data processing.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Climate Data Analytics</h3>
                <p className="text-center text-muted-foreground">
                  Gain insights with powerful environmental analytics tools that help identify pollution patterns and predict climate trends to support sustainable urban planning decisions.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-4">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Environmental Alerts & Notifications</h3>
                <p className="text-center text-muted-foreground">
                  Receive immediate environmental alerts and public notifications when pollution levels, CO emissions, or climate conditions exceed safe thresholds for community health protection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Why Choose CityAir+ for Urban Air Quality Monitoring?
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform offers unique advantages for urban air quality monitoring.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Real-Time Climate Action & Carbon Emission Response</h3>
                <p className="text-muted-foreground">
                  CityAir+ provides immediate carbon emission alerts through LED indicators during high-emission periods, enabling proactive community intervention rather than reactive climate reporting and empowering citizens to take instant carbon footprint reduction actions.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Climate-Conscious Community Engagement</h3>
                <p className="text-muted-foreground">
                  CityAir+ builds carbon literacy through real-time emission data education and serves as a behavioral change catalyst for climate-conscious transportation and energy choices while supporting democratic climate action and environmental equity advocacy.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Smart Environmental Health Monitoring</h3>
                <p className="text-muted-foreground">
                  CityAir+ transforms urban environmental health through continuous air quality monitoring, helping cities reduce pollution exposure, protect vulnerable populations, and create healthier communities through data-driven environmental interventions and real-time public health guidance.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Evidence-Based Climate Policy</h3>
                <p className="text-muted-foreground">
                  Make informed environmental policy decisions based on comprehensive air quality data and climate analytics that enable cities to implement targeted pollution reduction strategies, meet environmental regulations, and achieve sustainable development goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Transform Your City's Environmental Health?
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join the environmental monitoring revolution and start building a cleaner, healthier urban future with CityAir+ today.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/public-monitor">
                  <Button size="lg" variant="secondary" className="gap-1">
                    Start Environmental Monitoring <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-primary-foreground">
                    Contact Environmental Experts
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">© 2025 CityAir+. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}