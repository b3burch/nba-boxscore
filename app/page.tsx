import LeaguePage from "@/components/LeaguePage";

export const metadata = { title: "NBA | The Daily Box" };
export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <LeaguePage league="nba" />;
}
