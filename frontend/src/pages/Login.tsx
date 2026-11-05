import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, Eye, EyeOff, ArrowRight } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const locationState = location.state as {
    message?: string;
    redirectTo?: string;
  } | null;
  const successMessage = locationState?.message;

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;
      login(token, user);

      if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        const redirectTo = locationState?.redirectTo;
        navigate(
          redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
            ? redirectTo
            : "/dashboard",
          { replace: true }
        );
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message ||
            "Login failed. Please verify your credentials."
        );
      } else {
        setError("Unable to connect to the server. Please check your network.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-black/10 px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E85D3F] text-white shadow-sm">
              <CalendarDays size={18} />
            </span>
            <span className="text-2xl font-black tracking-tight text-[#20201F]">
              eventra<span className="text-[#E85D3F]">.</span>
            </span>
          </Link>

          <p className="text-sm text-[#77736E]">
            New to Eventra?{" "}
            <Link
              to="/register"
              className="font-bold text-[#E85D3F] hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-xl md:grid-cols-2">
          {/* Left Hero Panel */}
          <div className="relative hidden min-h-[580px] overflow-hidden bg-[#20201F] p-12 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E85D3F]/35 via-transparent to-transparent pointer-events-none" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FFC6B6]">
                Welcome Back
              </span>

              <h1 className="mt-8 text-4xl font-black leading-tight lg:text-5xl">
                Good things
                <br />
                happen when
                <br />
                we <span className="font-editorial italic text-[#E85D3F]">show up.</span>
              </h1>

              <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70">
                Discover local gatherings, manage your registrations, or organize
                memorable moments with your community.
              </p>
            </div>

            <div className="relative border-t border-white/15 pt-6 text-xs text-white/60">
              <p className="font-semibold text-white/80">Every event. One platform.</p>
              <p className="mt-1">Secure authentication & effortless coordination.</p>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="flex items-center justify-center p-8 sm:p-12">
            <div className="w-full max-w-md">
              <span className="inline-block rounded-full bg-[#E85D3F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C64A30]">
                Sign In
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#20201F] sm:text-4xl">
                Welcome back<span className="text-[#E85D3F]">.</span>
              </h2>

              <p className="mt-2 text-sm text-[#77736E]">
                Enter your credentials to access your Eventra account.
              </p>

              {successMessage && (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  {successMessage}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#20201F]"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-black/15 bg-[#FAF7F2]/50 px-4 py-3.5 text-sm text-[#20201F] outline-none transition placeholder:text-[#9C968F] focus:border-[#E85D3F] focus:bg-white focus:ring-4 focus:ring-[#E85D3F]/10"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#20201F]"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-black/15 bg-[#FAF7F2]/50 px-4 py-3.5 pr-12 text-sm text-[#20201F] outline-none transition placeholder:text-[#9C968F] focus:border-[#E85D3F] focus:bg-white focus:ring-4 focus:ring-[#E85D3F]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#77736E] hover:text-[#20201F] transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E85D3F] px-5 py-4 text-sm font-bold text-white shadow-md shadow-[#E85D3F]/20 transition hover:bg-[#20201F] hover:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign in to Eventra"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-[#77736E]">
                Don't have an account yet?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#E85D3F] hover:underline"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#77736E] border-t border-black/10">
        © {new Date().getFullYear()} Eventra. Experiences that bring us together.
      </footer>
    </div>
  );
}