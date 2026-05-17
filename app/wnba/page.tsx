import LeaguePage from "@/components/LeaguePage";

export const metadata = { title: { absolute: "WNBA | The Daily Box" } };
export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default function WnbaPage() {
  return <LeaguePage league="wnba" />;
}
