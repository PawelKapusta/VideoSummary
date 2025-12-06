import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import QueryProvider from '@/components/providers/QueryProvider';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  currentPath?: string;
  onClick?: () => void;
}

const NavLink = ({ href, children, currentPath, onClick }: NavLinkProps) => {
  const isActive = currentPath === href;
  
  return (
    <a 
      href={href} 
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary px-4 py-2 rounded-md",
        isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:bg-accent/50",
        "hover:outline-1 hover:outline-primary hover:outline"
      )}
      onClick={onClick}
    >
      {children}
    </a>
  );
};

interface HeaderProps {
  currentPath?: string;
}

function HeaderContent({ currentPath = '' }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: 'Home', href: '/dashboard' },
    { name: 'Summaries', href: '/summaries' },
    { name: 'Profile', href: '/profile' },
    { name: 'Generate', href: '/generate' },
    { name: 'Videos', href: '/videos' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center px-4 md:px-8">
        <div className="mr-4 hidden md:flex">
          <a href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">VideoSummary</span>
          </a>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden mr-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] max-w-[300px] pr-0 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 rounded-r-xl">
              <SheetHeader className="text-left px-4 pt-6">
                <SheetTitle className="text-zinc-950 dark:text-zinc-50 text-xl font-bold">VideoSummary</SheetTitle>
              </SheetHeader>
              <div className="grid gap-1 py-6 px-2">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "block px-4 py-3 text-base font-medium rounded-lg transition-colors",
                      currentPath === link.href
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-bold ml-2">VideoSummary</span>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium mr-4">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} currentPath={currentPath}>
                {link.name}
              </NavLink>
            ))}
          </nav>
          {/* Logout button removed */}
        </div>
      </div>
    </header>
  );
}

export function Header(props: HeaderProps) {
  return (
    <QueryProvider>
      <HeaderContent {...props} />
    </QueryProvider>
  );
}
