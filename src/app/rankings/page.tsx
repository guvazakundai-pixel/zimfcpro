import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RankingsTable } from "@/components/RankingsTable";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rankings · ZIM FCPRO",
  description: "Live global rankings for Zimbabwe's competitive EA Sports FC season.",
};

export default function RankingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ErrorBoundary scope="rankings-table">
        <RankingsTable />
      </ErrorBoundary>
    </div>
  );
}
