import JobsView from "@/components/jobs/JobsView";
import SegmentedNav from "@/components/layout/SegmentedNav";

export const metadata = {
  title: "Offres — CVMatchr",
};

export default function JobsPage() {
  return (
    <div className="wrap">
      <header className="topbar topbar--secondary">
        <h1 className="hist-h1">Offres</h1>
        <div className="topbar-center">
          <SegmentedNav />
        </div>
        <div className="topbar-actions" />
      </header>

      <div className="pane" style={{ overflowY: "auto" }}>
        <div className="hist-content">
          <JobsView />
        </div>
      </div>
    </div>
  );
}
