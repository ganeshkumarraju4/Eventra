import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#FAF7F2] py-12 px-6 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E85D3F] text-white">
                <CalendarDays size={16} />
              </span>
              <span className="text-xl font-black tracking-tight text-[#20201F]">
                eventra<span className="text-[#E85D3F]">.</span>
              </span>
            </Link>
            <p className="text-sm text-[#77736E] max-w-sm">
              Every event. One platform. Bring people together for experiences worth showing up for.
            </p>
          </div>

        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row text-xs text-[#77736E]">
          <p>© {new Date().getFullYear()} Eventra. Made for moments that matter.</p>
          <p className="flex items-center gap-1">
            Built with modern web excellence
          </p>
        </div>
      </div>
    </footer>
  );
}
