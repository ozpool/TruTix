import { Link, NavLink, Outlet } from "react-router-dom";
import { ConnectButton } from "./ConnectButton";

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-sky-400" : "text-slate-300 hover:text-white";

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold">
            TruTix
          </Link>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/events" className={navClass}>
              Events
            </NavLink>
            <NavLink to="/resale" className={navClass}>
              Resale
            </NavLink>
            <NavLink to="/me" className={navClass}>
              My Tickets
            </NavLink>
          </nav>
        </div>
        <ConnectButton />
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
