interface LegalHeaderProps {
  activePage: 'terms' | 'privacy';
}

export function LegalHeader({ activePage }: LegalHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <a 
            href="/" 
            className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            VideoSummary
          </a>
          <nav className="flex items-center gap-6">
            <a 
              href="/terms" 
              className={`text-sm font-medium transition-colors ${
                activePage === 'terms' 
                  ? 'text-foreground border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Terms of Service
            </a>
            <a 
              href="/privacy" 
              className={`text-sm font-medium transition-colors ${
                activePage === 'privacy' 
                  ? 'text-foreground border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Privacy Policy
            </a>
            <a 
              href="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

