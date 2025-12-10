export function LegalFooter() {
  return (
    <div className="mt-16 pt-8 border-t border-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© 2025 VideoSummary. All rights reserved.</p>
        <div className="flex gap-6">
          <a 
            href="/terms" 
            className="hover:text-foreground transition-colors"
          >
            Terms of Service
          </a>
          <a 
            href="/privacy" 
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </a>
          <a 
            href="mailto:support@ytinsights.com" 
            className="hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}

