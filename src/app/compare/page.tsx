import { constituencies } from "@/data/constituencies";
import { CompareExplorer } from "./compare-explorer";

export const metadata = {
  title: "Compare constituencies — Constituency Pulse",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Compare constituencies</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pick any two of the {constituencies.length} curated seats to compare swing metrics,
          sentiment, and coverage side by side.
        </p>
      </div>

      <CompareExplorer constituencies={constituencies} />
    </div>
  );
}
