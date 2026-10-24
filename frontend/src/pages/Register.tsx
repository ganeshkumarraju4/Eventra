import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, CalendarDays } from "lucide-react";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const handleSubmit = async (
  event: React.SubmitEvent<HTMLFormElement>
) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all the fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Account created successfully! Please sign in." },
      });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const response = (
          err as {
            response?: {
              data?: { message?: string };
            };
          }
        ).response;

        setError(
          response?.data?.message ||
            "Registration failed. Please try again."
        );
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#20253b]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#303b76] text-white">
            <CalendarDays size={21} />
          </span>
          <span className="text-xl font-bold tracking-tight">Eventra</span>
        </Link>

        <p className="text-sm text-gray-600">
          Already a member?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#303b76] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-100px)] max-w-7xl items-center gap-12 px-6 py-10 sm:px-10 lg:grid-cols-2 lg:gap-20">
        <div className="mx-auto w-full max-w-md">
          <span className="inline-flex rounded-full bg-[#eeeef8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#303b76]">
            Your next chapter starts here
          </span>

          <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Make room for
            <br />
            <span className="text-[#e77c68]">great experiences.</span>
          </h1>

          <p className="mt-5 max-w-md leading-7 text-gray-600">
            Create your Eventra account to discover events, manage
            registrations, and keep everything happening in one place.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#303b76] focus:ring-4 focus:ring-[#303b76]/10"
                required
              />
            </div>

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
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#303b76] focus:ring-4 focus:ring-[#303b76]/10"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#303b76] focus:ring-4 focus:ring-[#303b76]/10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#303b76]"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#303b76] focus:ring-4 focus:ring-[#303b76]/10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#303b76]"
                >
                  {showConfirmPassword ? (
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#303b76] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#252e60] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating your account..." : "Create account"}
              {!loading && <ArrowRight size={18} />}
            </button>

            <p className="text-center text-xs leading-5 text-gray-500">
              By creating an account, you agree to use Eventra responsibly.
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#303b76] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <aside className="relative hidden min-h-[590px] overflow-hidden rounded-[2rem] bg-[#303b76] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#e77c68]/20 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-medium tracking-[0.2em] text-white/70">
              EVERY EVENT. ONE PLATFORM.
            </p>

            <h2 className="mt-8 max-w-md text-4xl font-bold leading-tight">
              Good things happen when people come together.
            </h2>

            <p className="mt-5 max-w-sm leading-7 text-white/70">
              From discovering your next favourite event to keeping track of
              every registration, your plans have a home here.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-lg font-semibold">
              One account. A world of experiences.
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Join Eventra and make your next event easier to find and manage.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
