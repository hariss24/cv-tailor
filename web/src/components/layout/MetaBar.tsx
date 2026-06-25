"use client";

import { useDocStore } from "@/state/docStore";
import type { DocType } from "@/lib/resume/schema";

const DOC_TYPES: DocType[] = ["CV", "Lettre", "Maître", "Autre"];
const DOC_TYPE_LABELS: Record<DocType, string> = {
  CV: "CV",
  Lettre: "Lettre",
  Maître: "CV Maître",
  Autre: "Autre",
};

/**
 * Barre meta : Type de document + Entreprise + Poste.
 * Port de la `.meta` de l'app Flask (templates/index.html).
 */
export default function MetaBar() {
  const docType = useDocStore((s) => s.docType);
  const company = useDocStore((s) => s.company);
  const role = useDocStore((s) => s.role);
  const setDocType = useDocStore((s) => s.setDocType);
  const setCompany = useDocStore((s) => s.setCompany);
  const setRole = useDocStore((s) => s.setRole);

  return (
    <div className="meta">
      <div className="field">
        <label htmlFor="doc_type">Type</label>
        <select
          id="doc_type"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOC_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="company">Entreprise</label>
        <input
          type="text"
          id="company"
          placeholder="Acme Corp"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="role">Poste</label>
        <input
          type="text"
          id="role"
          placeholder="Software Engineer"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>
    </div>
  );
}
