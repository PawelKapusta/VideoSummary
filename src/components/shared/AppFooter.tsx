export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <a href="/" className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors inline-block mb-3">
              VideoSummary
            </a>
            <p className="text-sm text-muted-foreground max-w-md">
              AI-powered YouTube video summarization. Save time and get the key insights from any video in seconds.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/summaries" className="hover:text-foreground transition-colors">
                  Summaries
                </a>
              </li>
              <li>
                <a href="/generate" className="hover:text-foreground transition-colors">
                  Generate
                </a>
              </li>
              <li>
                <a href="/profile" className="hover:text-foreground transition-colors">
                  Profile
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="mailto:support@ytinsights.com" className="hover:text-foreground transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="mailto:privacy@ytinsights.com" className="hover:text-foreground transition-colors">
                  Privacy Requests
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} VideoSummary. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

