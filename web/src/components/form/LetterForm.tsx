"use client";

import { useDocStore } from "@/state/docStore";
import type { Letter } from "@/lib/resume/schema";

/**
 * Formulaire structuré de la Lettre de motivation. Lit la lettre courante dans le store
 * et applique chaque modification via `setJson` → re-rend l'aperçu.
 */
export default function LetterForm() {
  const json = useDocStore((s) => s.json);
  const setJson = useDocStore((s) => s.setJson);

  const letter = json as Letter;
  const update = (patch: Partial<Letter>) => setJson({ ...letter, ...patch });

  return (
    <div className="pane-body form-editor">
      <section className="form-section">
        <h3 className="form-section__title">Expéditeur</h3>
        <div className="form-grid">
          <Field label="Nom" value={letter.sender_name} onChange={(v) => update({ sender_name: v })} />
          <Field label="Adresse" value={letter.sender_address} onChange={(v) => update({ sender_address: v })} />
          <Field label="Contact" value={letter.sender_contact} onChange={(v) => update({ sender_contact: v })} />
          <Field label="Date / lieu" value={letter.date} onChange={(v) => update({ date: v })} />
        </div>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">Destinataire</h3>
        <div className="form-grid">
          <Field label="Nom / entreprise" value={letter.recipient_name} onChange={(v) => update({ recipient_name: v })} />
          <Field label="Service" value={letter.recipient_service} onChange={(v) => update({ recipient_service: v })} />
          <Field label="Adresse" value={letter.recipient_address} onChange={(v) => update({ recipient_address: v })} />
        </div>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">Lettre</h3>
        <Field label="Objet" value={letter.subject} onChange={(v) => update({ subject: v })} />
        <Field label="Formule d'appel" value={letter.greeting} onChange={(v) => update({ greeting: v })} />
        <div className="form-field">
          <label className="form-label">Corps</label>
          <textarea
            className="form-textarea"
            rows={8}
            value={letter.body}
            onChange={(e) => update({ body: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Formule de politesse</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={letter.signoff}
            onChange={(e) => update({ signoff: e.target.value })}
          />
        </div>
        <Field label="Signature" value={letter.signature} onChange={(v) => update({ signature: v })} />
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input className="form-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
