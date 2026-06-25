import { Link, NavLink, Outlet } from "react-router-dom";
import { ConnectButton } from "./ConnectButton";
import { NetworkGuard } from "./NetworkGuard";
import { cn } from "../lib/cn";

const links = [
  { to: "/events", label: "Events" },
  { to: "/resale", label: "Resale" },
  { to: "/me", label: "My Tickets" },
  { to: "/org", label: "Organizer" },
  { to: "/scan", label: "Scan" },
  { to: "/whitepaper", label: "Docs" },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative whitespace-nowrap px-1 py-1 text-sm font-medium transition-colors",
    isActive ? "text-white" : "text-slate-400 hover:text-slate-100",
  );

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-md">
        <NetworkGuard />
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 font-display text-sm text-white"
              >
                T
              </span>
              TruTix
            </Link>
            <nav aria-label="Primary" className="hidden items-center gap-4 md:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={navClass} end={l.to === "/"}>
                  {({ isActive }) => (
                    <>
                      {l.label}
                      {isActive && (
                        <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-full bg-brand-500" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          <ConnectButton />
        </div>
        {/* Mobile nav: horizontally scrollable row. */}
        <nav
          aria-label="Primary mobile"
          className="flex gap-4 overflow-x-auto border-t border-ink-800/80 px-4 py-2 md:hidden"
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="animate-rise">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-ink-800/80 px-4 py-6 text-center text-xs text-slate-600">
        TruTix · NFT tickets on Base Sepolia · anti-scalping by design
      </footer>
    </div>
  );
}
