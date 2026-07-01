import Link from "next/link";
import JobsView from "@/components/jobs/JobsView";

export const metadata = {
  title: "Offres — CV Tailor",
};

export default function JobsPage() {
  return (
    <div className="wrap">
      <header className="topbar">
        <h1 className="hist-h1">Offres</h1>
        <div className="topbar-actions">
          <Link href="/" style={{ color: "var(--link)", fontWeight: 600, fontSize: "14px" }}>
            ‹ Retour
          </Link>
        </div>
      </header>

      <div className="pane" style={{ overflowY: "auto" }}>
        <div className="hist-content">
          <JobsView />
        </div>
      </div>
    </div>
  );
}
