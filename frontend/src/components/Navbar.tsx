import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Menu,
  X,
  Compass,
  Ticket,
  PlusCircle,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) =>
    `px-3 py-2 text-sm font-semibold transition-all rounded-lg ${
      isActive(path)
        ? "text-[#E85D3F] bg-[#E85D3F]/10"
        : "text-[#77736E] hover:text-[#20201F] hover:bg-black/5"
    }`;

  const mobileLinkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${
      isActive(path)
        ? "text-[#E85D3F] bg-[#E85D3F]/10"
        : "text-[#77736E] hover:text-[#20201F] hover:bg-black/5"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#FAF7F2]/90 backdrop-blur-md transition-all">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? (isAdmin ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E85D3F] text-white shadow-sm transition group-hover:scale-105 group-hover:bg-[#20201F]">
            <CalendarDays size={18} />
          </span>
          <span className="text-2xl font-black tracking-tight text-[#20201F]">
            eventra<span className="text-[#E85D3F]">.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {isAuthenticated ? (
            <>
              {!isAdmin && (
                <Link to="/dashboard" className={linkClass("/dashboard")}>
                  Dashboard
                </Link>
              )}
              <Link to="/events" className={linkClass("/events")}>
                Explore
              </Link>
              {!isAdmin && (
                <>
                  <Link to="/my-events" className={linkClass("/my-events")}>
                    My Events
                  </Link>
                  <Link to="/my-registrations" className={linkClass("/my-registrations")}>
                    My Tickets
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" className={linkClass("/admin")}>
                  Admin Panel
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className={linkClass("/")}>
                Home
              </Link>
              <Link to="/events" className={linkClass("/events")}>
                Explore Events
              </Link>
            </>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/create-event"
                className="inline-flex items-center gap-2 rounded-full bg-[#E85D3F] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#20201F] hover:text-white"
              >
                <PlusCircle size={15} />
                <span>Host Event</span>
              </Link>

              <div className="h-6 w-px bg-black/10 mx-1" />

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E85D3F]/15 text-[#E85D3F] font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                </div>
                <div className="text-left text-xs leading-tight">
                  <p className="font-bold text-[#20201F] max-w-[120px] truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[#77736E]">
                    {isAdmin ? "Admin" : "Organizer"}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="rounded-full p-2 text-[#77736E] transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={17} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2.5 text-sm font-semibold text-[#20201F] transition hover:text-[#E85D3F]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#E85D3F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20201F] hover:text-white"
              >
                <span>Get Started ↗</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && (
            <Link
              to="/create-event"
              className="rounded-full bg-[#E85D3F] p-2 text-white shadow-sm"
              title="Create event"
            >
              <PlusCircle size={18} />
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-[#20201F] hover:bg-black/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-black/10 bg-[#FAF7F2] px-6 py-6 md:hidden">
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-black/10 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E85D3F] text-white font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
                </div>
                <div>
                  <p className="font-bold text-[#20201F]">{user?.name}</p>
                  <p className="text-xs text-[#77736E]">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#E85D3F]">
                    {isAdmin ? "Administrator" : "Organizer"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                {!isAdmin && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileLinkClass("/dashboard")}
                  >
                    <Compass size={18} />
                    <span>Dashboard</span>
                  </Link>
                )}
                <Link
                  to="/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass("/events")}
                >
                  <CalendarDays size={18} />
                  <span>Explore Events</span>
                </Link>
                {!isAdmin && (
                  <>
                    <Link
                      to="/my-events"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileLinkClass("/my-events")}
                    >
                      <Layers size={18} />
                      <span>My Events</span>
                    </Link>
                    <Link
                      to="/my-registrations"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileLinkClass("/my-registrations")}
                    >
                      <Ticket size={18} />
                      <span>My Registrations</span>
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileLinkClass("/admin")}
                  >
                    <ShieldCheck size={18} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link
                  to="/create-event"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-[#E85D3F] px-4 py-3 text-sm font-semibold text-white shadow-sm mt-3 hover:bg-[#20201F] hover:text-white transition"
                >
                  <PlusCircle size={18} />
                  <span>Host a New Event</span>
                </Link>
              </div>

              <div className="border-t border-black/10 pt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileLinkClass("/")}
              >
                <span>Home</span>
              </Link>
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileLinkClass("/events")}
              >
                <span>Explore Events</span>
              </Link>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-[#20201F]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center rounded-xl bg-[#E85D3F] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#20201F] hover:text-white transition"
                >
                  <span>Get Started ↗</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
