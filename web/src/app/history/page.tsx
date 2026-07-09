import HistoryList from "@/components/history/HistoryList";
import HistoryActions from "@/components/history/HistoryActions";
import Link from "next/link";

export const metadata = {
  title: "Historique — CV Tailor",
};

export default function HistoryPage() {
  return (
    <div className="wrap">
      <header className="topbar topbar--secondary">
        <h1 className="hist-h1">Historique</h1>
        <div className="topbar-actions">
          <HistoryActions />
          <Link href="/" style={{ color: "var(--link)", fontWeight: 600, fontSize: "14px" }}>
            ‹ Retour
          </Link>
        </div>
      </header>

      <div className="pane" style={{ overflowY: "auto" }}>
        <div className="hist-content">
          <HistoryList />
        </div>
      </div>
    </div>
  );
}
