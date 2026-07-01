import type { JobEntry } from "@/lib/storage/db";

/** Carte d'une offre retenue : infos + score + actions (« Adapter mon CV » / « Masquer »). */
export default function JobCard({
  job,
  onAdapt,
  onDismiss,
}: {
  job: JobEntry;
  onAdapt: (job: JobEntry) => void;
  onDismiss: (job: JobEntry) => void;
}) {
  const tier = job.score >= 85 ? "high" : job.score >= 70 ? "mid" : "low";

  return (
    <div className="job-card" data-testid="job-card">
      <div className={`job-score job-score-${tier}`} title="Score de pertinence">
        <span className="job-score-num">{job.score}</span>
        <span className="job-score-max">/100</span>
      </div>

      <div className="job-main">
        <div className="job-title">{job.title || "Sans titre"}</div>
        <div className="job-meta">
          {job.company || "Entreprise inconnue"}
          {job.location ? ` · ${job.location}` : ""}
        </div>
        {job.commute ? <div className="job-commute">🚉 {job.commute}</div> : null}
      </div>

      <div className="job-actions">
        <button type="button" className="tailor-btn" onClick={() => onAdapt(job)} data-testid="job-adapt">
          Adapter mon CV
        </button>
        {job.url ? (
          <a className="neu-btn-sm" href={job.url} target="_blank" rel="noopener noreferrer">
            Voir l&apos;offre
          </a>
        ) : null}
        <button type="button" className="neu-btn-sm danger" onClick={() => onDismiss(job)} data-testid="job-dismiss">
          Masquer
        </button>
      </div>
    </div>
  );
}
