import type { ScanState } from "./JobsView";

/** Barre de progression du scan : phase courante + compteurs (notées / trouvées · retenues). */
export default function ScanProgress({ phase, found, scored, retained }: ScanState) {
  const pct = found > 0 ? Math.round((scored / found) * 100) : 0;
  return (
    <div className="scan-progress" data-testid="scan-progress" role="status" aria-live="polite">
      <div className="scan-progress-bar">
        <div className="scan-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="scan-progress-text">
        {phase}
        {found > 0 ? ` · ${scored}/${found} notées · ${retained} retenues` : ""}
      </div>
    </div>
  );
}
