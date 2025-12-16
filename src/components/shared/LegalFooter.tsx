interface LegalFooterProps {
  activePage?: 'terms' | 'privacy';
}

export function LegalFooter({ activePage }: LegalFooterProps = {}) {
  return (
    <footer className="relative bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 mt-16 overflow-hidden shadow-2xl shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.15),0_-4px_16px_-4px_rgba(0,0,0,0.1)] w-full">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] [mask-image:radial-gradient(white,transparent_85%)]" />

      <div className="relative container mx-auto px-4 pt-8 pb-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 VideoSummary. All rights reserved.</p>
          <div className="flex gap-6">
            <a
              href="/terms"
              className={`text-foreground/80 hover:text-foreground hover:scale-105 px-2 py-1 rounded-md transition-all duration-200 ${
                activePage === 'terms' ? 'font-medium' : ''
              }`}
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className={`text-foreground/80 hover:text-foreground hover:scale-105 px-2 py-1 rounded-md transition-all duration-200 ${
                activePage === 'privacy' ? 'font-medium' : ''
              }`}
            >
              Privacy Policy
            </a>
            <a
              href="mailto:support@videosummary.com"
              className="text-foreground/80 hover:text-foreground hover:scale-105 px-2 py-1 rounded-md transition-all duration-200"
            >
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
    </footer>
  );
}

