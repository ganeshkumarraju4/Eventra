import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Eye, EyeOff, ArrowRight } from "lucide-react";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();

const [showPassword, setShowPassword] = useState(false);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setError("");
  setLoading(true);

  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data;

    // Save the authentication token and user details.
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // Redirect based on the user's role.
    if (user.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err
    ) {
      const axiosError = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setError(
        axiosError.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } else {
      setError("Unable to connect to the server. Please try again.");
    }
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F]">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-black/10 px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E85D3F] text-white">
            <CalendarDays size={19} />
          </span>

          <span className="text-2xl font-black tracking-tight">
            eventra<span className="text-[#E85D3F]">.</span>
          </span>
        </Link>

        <p className="text-sm text-[#77736E]">
          New to Eventra?{" "}
          <Link
            to="/register"
            className="font-bold text-[#E85D3F] hover:text-[#20201F]"
          >
            Create account
          </Link>
        </p>
      </nav>

      {/* Login section */}
      <main className="flex min-h-[calc(100vh-81px)] items-center justify-center px-5 py-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-sm md:grid-cols-2">
          {/* Left panel */}
          <div className="relative hidden min-h-[560px] overflow-hidden bg-[#20201F] p-10 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E85D3F]/40 via-transparent to-transparent" />

            <div className="relative">
              <p className="text-xs font-bold tracking-[0.2em] text-[#FFC6B6]">
                YOUR NEXT CHAPTER
              </p>

              <h1 className="mt-8 text-5xl font-black leading-tight">
                Good things
                <br />
                happen when
                <br />
                we <span className="font-serif italic text-[#E85D3F]">show up.</span>
              </h1>

              <p className="mt-6 max-w-sm leading-7 text-white/65">
                Discover experiences, meet your people, and turn ordinary
                days into memorable moments.
              </p>
            </div>

            <div className="relative border-t border-white/15 pt-6">
              <p className="text-sm text-white/70">
                Every event. One platform.
              </p>
              <p className="mt-2 text-xs text-white/40">
                Welcome to the Eventra community.
              </p>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex items-center justify-center p-7 sm:p-12 md:p-14">
            <div className="w-full max-w-md">
              <div className="mb-8 inline-flex items-center rounded-full border border-[#E85D3F]/25 bg-[#E85D3F]/5 px-3 py-2 text-xs font-bold tracking-wider text-[#C64A30]">
                WELCOME BACK
              </div>

              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                Sign in<span className="text-[#E85D3F]">.</span>
              </h2>

              <p className="mt-4 leading-7 text-[#77736E]">
                Pick up where you left off. Your next experience awaits.
              </p>

              <form
                className="mt-9 space-y-6"
                onSubmit={handleLogin}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-black/15 bg-[#FAF7F2]/50 px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A09A93] focus:border-[#E85D3F] focus:ring-2 focus:ring-[#E85D3F]/10"
                    />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold"
                    >
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="w-full rounded-xl border border-black/15 bg-[#FAF7F2]/50 px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-[#A09A93] focus:border-[#E85D3F] focus:ring-2 focus:ring-[#E85D3F]/10"
                        />
                

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#77736E] transition hover:text-[#E85D3F]"
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                    )}

               <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#E85D3F] px-5 py-4 font-semibold !text-white transition duration-300 hover:bg-[#20201F] hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-[#77736E]">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#E85D3F] hover:text-[#20201F]"
                >
                  Sign up
                </Link>
              </p>

              <div className="mt-8 border-t border-black/10 pt-6 text-center">
                <Link
                  to="/"
                  className="text-sm font-medium text-[#77736E] transition hover:text-[#E85D3F]"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;