import { useState } from 'react';
import { Menu, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface LegalHeaderProps {
  activePage: 'terms' | 'privacy';
}

export function LegalHeader({ activePage }: LegalHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/terms', label: 'Terms of Service', active: activePage === 'terms', icon: FileText },
    { href: '/privacy', label: 'Privacy Policy', active: activePage === 'privacy', icon: Shield },
    { href: '/dashboard', label: 'Dashboard', active: false, icon: null },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-background via-background/98 to-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-background/90 supports-[backdrop-filter]:via-background/95 supports-[backdrop-filter]:to-background/90 shadow-lg relative before:absolute before:bottom-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/30 before:to-transparent">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <div className="md:hidden flex items-center">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-all duration-200 hover:scale-105">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
              <SheetContent side="left" className="w-[80%] max-w-[300px] pr-0 bg-white text-black rounded-r-xl shadow-2xl">
                <SheetHeader className="text-left px-4 pt-6 pb-4">
                  <SheetTitle className="flex items-center space-x-2 text-zinc-950 dark:text-zinc-50">
                    <span className="text-xl font-bold text-black">VideoSummary</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="grid gap-2 py-4 px-2">
                  {navLinks.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "relative block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 group flex items-center gap-3",
                          link.active
                            ? "bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-gradient-to-r hover:from-zinc-50 hover:to-zinc-100 dark:hover:from-zinc-900 dark:hover:to-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:scale-[1.02]"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {IconComponent && <IconComponent className="h-5 w-5 flex-shrink-0" />}
                        {link.label}
                        <span className={cn(
                          "absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-primary to-primary/80 transition-all duration-200 rounded-r-full",
                          link.active ? "h-3/4" : "group-hover:h-1/2"
                        )} />
                      </a>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
            </div>

            {/* Logo/Brand */}
            <a
              href="/"
              className="text-lg sm:text-2xl font-bold text-black hover:text-primary transition-colors"
            >
              VideoSummary
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg group ${
                  link.active
                    ? 'text-foreground bg-gradient-to-r from-accent to-accent/80 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                } hover:scale-105 hover:shadow-md hover:outline-1 hover:outline-primary/20 hover:outline`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/80 transition-all duration-200 group-hover:w-3/4 ${
                  link.active ? 'w-3/4' : ''
                }`} />
              </a>
            ))}
          </nav>
        </div>

      </div>
    </header>
  );
}

