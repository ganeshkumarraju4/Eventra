import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Ticket,
} from "lucide-react";
import "../App.css";
const featuredEvents = [
  {
    id: 1,
    category: "MUSIC",
    title: "An Evening of Live Music",
    date: "NOV 08, 2026",
    location: "Mumbai, India",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=85",
    color: "#f4d9c7",
  },
  {
    id: 2,
    category: "CREATIVE",
    title: "Ideas That Shape Tomorrow",
    date: "NOV 14, 2026",
    location: "Pune, India",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=85",
    color: "#dce5d5",
  },
  {
    id: 3,
    category: "COMMUNITY",
    title: "Meet, Connect & Create",
    date: "NOV 21, 2026",
    location: "Hyderabad, India",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85",
    color: "#e4dcf3",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#20201F]">
      {/* Navigation */}
      <header className="border-b border-black/10">
        <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-12">
          <a href="#" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E85D3F] text-white">
              <CalendarDays size={19} />
            </span>

            <span className="text-2xl font-black tracking-tight">
              eventra<span className="text-[#E85D3F]">.</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#discover" className="transition hover:text-[#E85D3F]">
              Discover
            </a>
            <a href="#categories" className="transition hover:text-[#E85D3F]">
              Categories
            </a>
            <a href="#about" className="transition hover:text-[#E85D3F]">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden px-3 py-2 text-sm font-semibold sm:inline-block"
            >
              Log in
            </a>

           <a
  href="/register"
  className="rounded-full bg-[#E85D3F] px-5 py-3 text-sm font-semibold !text-white transition duration-300 hover:bg-[#20201F] hover:!text-white"
>
  Get started <span className="ml-1 !text-white">↗</span>
</a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24 lg:gap-20">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#E85D3F]/30 px-4 py-2 text-xs font-bold tracking-[0.15em] text-[#C64A30]">
              <Sparkles size={15} />
              YOUR NEXT GREAT EXPERIENCE
            </div>

            <h1 className="max-w-2xl text-5xl font-black leading-[1.06] tracking-[-0.055em] sm:text-6xl lg:text-7xl xl:text-8xl">
              Make room
              <br />
              for something
              <br />
              <span className="font-serif font-medium italic text-[#E85D3F]">
                unforgettable.
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-8 text-[#77736E] md:text-lg">
              Discover experiences worth showing up for. Find your people,
              explore new ideas, and make your next story a great one.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#discover"
                className="inline-flex items-center gap-3 rounded-full bg-[#E85D3F] px-7 py-4 font-semibold text-white transition hover:bg-[#C94B32]"
              >
                Explore events
                <ArrowRight size={18} />
              </a>

              <a
                href="/register"
                className="px-4 py-3 text-sm font-semibold transition hover:text-[#E85D3F]"
              >
                Host an event ↗
              </a>
            </div>

            <div className="mt-12 flex items-center gap-4 border-t border-black/10 pt-6">
              <div className="flex -space-x-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FAF7F2] bg-[#E8BDA9] text-sm">
                  A
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FAF7F2] bg-[#C7D6C0] text-sm">
                  R
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FAF7F2] bg-[#D8C8E9] text-sm">
                  S
                </span>
              </div>

              <p className="text-sm text-[#77736E]">
                <span className="font-bold text-[#20201F]">
                  Find your people.
                </span>
                <br />
                Your next experience starts here.
              </p>
            </div>
          </div>

          {/* Featured image */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-3 -top-4 h-full w-full rounded-[2rem] border border-[#E85D3F]/40 md:-right-5 md:-top-5" />

            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=90"
                alt="People enjoying a live event together"
                className="h-[430px] w-full object-cover sm:h-[520px]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute left-6 top-6 rounded-full bg-[#FAF7F2] px-4 py-2 text-xs font-bold tracking-wider">
                THE SPOTLIGHT
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-7 text-white md:p-9">
                <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#FFC6B6]">
                  EXPERIENCES THAT BRING US TOGETHER
                </p>

                <h2 className="max-w-md text-3xl font-bold leading-tight md:text-4xl">
                  Good people.
                  <br />
                  Great moments.
                </h2>

                <div className="mt-6 flex items-center gap-5 text-sm text-white/85">
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} />
                    Live experiences
                  </span>
                  <ArrowDownRight size={21} />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-7 -left-4 hidden items-center gap-3 rounded-2xl bg-white p-4 shadow-xl sm:flex md:-left-10">
              <div className="rounded-xl bg-[#FBE6DF] p-3 text-[#E85D3F]">
                <Ticket size={24} />
              </div>
              <div>
                <p className="font-bold">Your next story</p>
                <p className="mt-1 text-xs text-[#77736E]">
                  Starts with a ticket.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section
          id="discover"
          className="border-y border-black/10 bg-white/60 px-6 py-10 md:px-12"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-5">
              <p className="text-xs font-bold tracking-[0.2em] text-[#E85D3F]">
                YOUR NEXT ADVENTURE
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                What are you in the mood for?
              </h2>
            </div>

            <form
              className="grid gap-3 rounded-2xl border border-black/10 bg-white p-3 md:grid-cols-[1fr_220px_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                document.getElementById("events-list")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <label className="flex items-center gap-3 px-3 py-2">
                <Search className="shrink-0 text-[#E85D3F]" size={21} />
                <input
                  type="search"
                  placeholder="Search events, experiences..."
                  aria-label="Search events"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#99938C]"
                />
              </label>

              <label className="flex items-center gap-3 border-black/10 px-3 py-2 md:border-l">
                <MapPin className="shrink-0 text-[#E85D3F]" size={20} />
                <select
                  aria-label="Choose location"
                  defaultValue=""
                  className="w-full bg-transparent text-sm outline-none"
                >
                  <option value="">Everywhere</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </label>

              <button
                type="submit"
                className="rounded-xl bg-[#20201F] px-7 py-3 font-semibold text-white transition hover:bg-[#E85D3F]"
              >
                Find events
              </button>
            </form>
          </div>
        </section>

        {/* Event cards */}
        <section
          id="events-list"
          className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28"
        >
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#E85D3F]">
                HANDPICKED FOR YOU
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Worth going out for.
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-[#77736E]">
                From big ideas to unforgettable nights, find something that
                makes you want to be there.
              </p>
            </div>

            <a
              href="/events"
              className="inline-flex items-center gap-2 pb-1 text-sm font-bold"
            >
              Discover all events <ArrowRight size={17} />
            </a>
          </div>

          <div
            id="categories"
            className="mb-8 flex flex-wrap gap-3"
          >
            {["All experiences", "Music", "Workshops", "Technology", "Community"].map(
              (category, index) => (
                <button
                  key={category}
                  className={`rounded-full border px-5 py-3 text-sm font-medium transition ${
                    index === 0
                      ? "border-[#20201F] bg-[#20201F] text-white"
                      : "border-black/10 bg-white hover:border-[#E85D3F] hover:text-[#E85D3F]"
                  }`}
                >
                  {category}
                </button>
              ),
            )}
          </div>

          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <article key={event.id} className="group">
                <a
                  href={`/events/${event.id}`}
                  className="relative block overflow-hidden rounded-2xl"
                  style={{ backgroundColor: event.color }}
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-64 w-full object-cover transition duration-500 group-hover:scale-105 md:h-72"
                  />

                  <span className="absolute left-4 top-4 rounded-full bg-[#FAF7F2] px-3 py-2 text-[10px] font-bold tracking-[0.15em]">
                    {event.category}
                  </span>

                  <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white transition group-hover:bg-[#E85D3F] group-hover:text-white">
                    <ArrowRight size={20} />
                  </span>
                </a>

                <div className="pt-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-[#E85D3F]">
                    <CalendarDays size={15} />
                    {event.date}
                  </div>

                  <h3 className="text-xl font-bold tracking-tight transition group-hover:text-[#E85D3F] md:text-2xl">
                    <a href={`/events/${event.id}`}>{event.title}</a>
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-[#77736E]">
                    <MapPin size={16} />
                    {event.location}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
                    <span className="flex items-center gap-2 text-xs text-[#77736E]">
                      <Clock3 size={15} />
                      Limited availability
                    </span>

                    <a
                      href={`/events/${event.id}`}
                      className="text-sm font-bold"
                    >
                      View details ↗
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Organizer CTA */}
        <section id="about" className="px-6 pb-20 md:px-12 md:pb-28">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 rounded-[2rem] bg-[#20201F] px-8 py-12 text-white md:flex-row md:items-center md:px-16 md:py-16">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#FFC6B6]">
                FOR THE PEOPLE WHO MAKE IT HAPPEN
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight md:text-5xl">
                Have an idea worth bringing people together for?
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-white/60">
                Create your event, manage registrations, and bring your
                community together with Eventra.
              </p>
            </div>

            <a
              href="/register"
              className="inline-flex shrink-0 items-center justify-center gap-3 self-start rounded-full bg-[#E85D3F] px-7 py-4 font-semibold transition hover:bg-white hover:text-[#20201F] md:self-center"
            >
              Create an event <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <a href="#" className="text-xl font-black tracking-tight">
            eventra<span className="text-[#E85D3F]">.</span>
          </a>

          <p className="text-sm text-[#77736E]">
            Every event. One platform.
          </p>

          <p className="text-xs text-[#77736E]">
            © 2026 Eventra. Made for moments that matter.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;