"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BellRing,
  BookOpen,
  LayoutDashboard,
  MapPinned,
  Menu,
  Radio,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/constituencies", label: "Constituencies", icon: MapPinned },
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold text-foreground">
          Constituency Pulse
        </span>
        <span className="text-[11px] text-muted-foreground">
          Sentiment intelligence
        </span>
      </div>
    </div>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Small, unobtrusive disclaimer banner shown on every page — see PROJECT_BRIEF's neutrality rules. */
function DisclaimerBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-1.5 text-xs text-muted-foreground">
      <AlertTriangle className="size-3.5 shrink-0 text-muted-foreground" />
      <p>
        Automated sentiment &amp; topic analysis — a prototype, not a definitive
        assessment. See{" "}
        <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
          Methodology
        </Link>{" "}
        for sources and limitations.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  // The site-password gate at /login is a standalone full-screen route (see
  // src/middleware.ts + src/app/login) — it renders before anyone should see
  // nav chrome or the disclaimer banner, so it opts out of the shell.
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <DisclaimerBanner />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 flex-col border-r border-border bg-sidebar px-3 py-4 md:flex">
          <div className="mb-6">
            <BrandMark />
          </div>
          <NavList pathname={pathname} />
        </aside>

        {/* Content — rendered exactly once; only the nav chrome above/below
            switches with viewport (a previous version duplicated {children}
            into separate mobile/desktop <main> elements toggled by CSS,
            which double-mounted every page's client components). */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
            <BrandMark />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <SheetContent side="left" className="w-64 px-3 py-4">
                <SheetHeader className="px-0 pt-0 pb-2">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <BrandMark />
                </SheetHeader>
                <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </header>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
