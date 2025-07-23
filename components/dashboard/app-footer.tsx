import Link from "next/link"

export function AppFooter() {
  return (
    <footer className="border-t py-4">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">© 2025 CityAir+. All rights reserved.</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-primary">
            Contact
          </Link>
          <Link href="https://iot-monitor-livid.vercel.app" className="hover:text-primary">
            Blog
          </Link>
        </div>
      </div>
    </footer>
  )
}

