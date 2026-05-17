import LeaguePage from "@/components/LeaguePage";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default function WnbaPage() {
  return <LeaguePage league="wnba" />;
}
