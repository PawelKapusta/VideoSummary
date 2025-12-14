export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 mt-auto overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] [mask-image:radial-gradient(white,transparent_85%)]" />

      <div className="relative container mx-auto px-4 py-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Brand Section - Left Column */}
          <div className="lg:col-span-1">
            <a
              href="/"
              className="group text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent hover:from-primary/90 hover:via-primary hover:to-primary/70 transition-all duration-300 inline-block mb-2 transform hover:scale-[1.02]"
            >
              VideoSummary
            </a>
            <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-sm mb-3">
              AI-powered YouTube video summarization. Save time and get the key insights from any video in seconds.
            </p>
            <a
              href="mailto:hello@ytinsights.com"
              className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm font-medium"
            >
              hello@ytinsights.com
            </a>
          </div>

          {/* Right Side - Product and Support */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 text-base tracking-wide uppercase text-center">
                Product
              </h3>
              <nav aria-label="Product navigation">
                <ul className="grid grid-cols-2 gap-3">
                  {[
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/summaries", label: "Summaries" },
                    { href: "/generate", label: "Generate" },
                    { href: "/profile", label: "Profile" }
                  ].map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-foreground/80 hover:text-foreground hover:font-medium px-3 py-2 rounded-lg transition-all duration-200 text-base text-center block"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Legal & Support Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 text-lg tracking-wide uppercase text-center">
                Support & Legal
              </h3>
              <nav aria-label="Legal and support navigation">
                <ul className="grid grid-cols-2 gap-3">
                  {[
                    { href: "/terms", label: "Terms of Service" },
                    { href: "/privacy", label: "Privacy Policy" },
                    { href: "mailto:support@ytinsights.com", label: "Contact Support" },
                    { href: "mailto:privacy@ytinsights.com", label: "Privacy Requests" }
                  ].map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-foreground/80 hover:text-foreground hover:font-medium px-3 py-2 rounded-lg transition-all duration-200 text-base text-center block"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm text-muted-foreground/70 font-medium">
              © {currentYear} VideoSummary. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
              <span>Made with ❤️ for content creators</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
    </footer>
  );
}

