import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Video, Home, FileText, User, Sparkles, Film, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import QueryProvider from "@/components/providers/QueryProvider";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  currentPath?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

const NavLink = ({ href, children, currentPath, onClick, icon: Icon }: NavLinkProps) => {
  const isActive = currentPath === href;

  return (
    <a
      href={href}
      className={cn(
        "relative text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg group flex items-center gap-2",
        isActive
          ? "text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
        "hover:scale-105 hover:shadow-md hover:outline-1 hover:outline-primary/20 hover:outline"
      )}
      onClick={onClick}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      <span
        className={cn(
          "absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/80 transition-all duration-200 group-hover:w-3/4",
          isActive ? "w-3/4" : ""
        )}
      />
    </a>
  );
};

interface HeaderProps {
  currentPath?: string;
}

function HeaderContent({ currentPath = "" }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Summaries", href: "/summaries", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Generate", href: "/generate", icon: Sparkles },
    { name: "Videos", href: "/videos", icon: Film },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-background via-background/98 to-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-background/90 supports-[backdrop-filter]:via-background/95 supports-[backdrop-filter]:to-background/90 shadow-lg relative before:absolute before:bottom-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/30 before:to-transparent">
      <div className="w-full flex h-18 md:h-16 items-center px-4 md:px-8">
        <div className="mr-4 hidden md:flex">
          <a href="/dashboard" className="mr-6 flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                <Video className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg text-black">VideoSummary</span>
            </div>
          </a>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden mr-2 flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-3 hover:bg-accent/50 transition-all duration-200 hover:scale-105"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[80%] max-w-[300px] pr-0 bg-white text-black rounded-r-xl shadow-2xl"
            >
              <SheetHeader className="text-left px-4 pt-6 pb-4">
                <SheetTitle className="flex items-center space-x-2 text-zinc-950 dark:text-zinc-50">
                  <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                    <Video className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-black">VideoSummary</span>
                </SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 py-4 px-2">
                {links.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "relative block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 group flex items-center gap-3",
                        currentPath === link.href
                          ? "bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-gradient-to-r hover:from-zinc-50 hover:to-zinc-100 dark:hover:from-zinc-900 dark:hover:to-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:scale-[1.02]"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {IconComponent && <IconComponent className="h-5 w-5 flex-shrink-0" />}
                      {link.name}
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-primary to-primary/80 transition-all duration-200 rounded-r-full",
                          currentPath === link.href ? "h-3/4" : "group-hover:h-1/2"
                        )}
                      />
                    </a>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center space-x-2 ml-2">
            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md shadow-sm">
              <Video className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-base text-black">VideoSummary</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="hidden md:flex items-center space-x-2 text-sm font-medium mr-4">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} currentPath={currentPath} icon={link.icon}>
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
