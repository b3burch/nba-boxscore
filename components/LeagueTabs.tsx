import Link from "next/link";
import type { League } from "@/lib/nba/leagues";

export default function LeagueTabs({ active }: { active: League }) {
  return (
    <nav className="league-tabs" aria-label="League selector">
      <Link
        href="/"
        className={`tab ${active === "nba" ? "active" : ""}`}
        prefetch={false}
      >
        NBA
      </Link>
      <Link
        href="/wnba"
        className={`tab ${active === "wnba" ? "active" : ""}`}
        prefetch={false}
      >
        WNBA
      </Link>
    </nav>
  );
}
