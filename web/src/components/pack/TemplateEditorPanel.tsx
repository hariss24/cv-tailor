"use client";

import { useRef } from "react";
import { TEMPLATE_VARIABLES } from "@/lib/templates/render";
import type { MailTemplate } from "@/lib/templates/defaults";

/**
 * Panneau d'édition d'un modèle lettre/email : boutons d'insertion de variables
 * + champs texte. L'insertion cible le dernier champ focusé (position du curseur).
 */
export default function TemplateEditorPanel({
  tpl,
  onChange,
  disabled,
}: {
  tpl: MailTemplate;
  onChange: (patch: Partial<MailTemplate>) => void;
  disabled?: boolean;
}) {
  // Dernier champ texte focusé + sa clé dans le modèle (cible de l'insertion de variable).
  const activeRef = useRef<{ el: HTMLInputElement | HTMLTextAreaElement; key: keyof MailTemplate } | null>(null);

  const insertVariable = (name: string) => {
    const active = activeRef.current;
    if (!active) return;
    const { el, key } = active;
    const token = `{${name}}`;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    onChange({ [key]: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };



  return (
    <div className="tpl-editor">
      <div className="tpl-vars" aria-label="Insérer une variable">
        <span className="form-label">Variables :</span>
        {TEMPLATE_VARIABLES.map((v) => (
          <button key={v} type="button" className="var-btn" disabled={disabled} onClick={() => insertVariable(v)}>
            + {v}
          </button>
        ))}
      </div>

      <label className="form-label">Objet de la lettre</label>
      <input className="form-input" value={tpl.letterSubject} disabled={disabled}
        onFocus={(e) => { activeRef.current = { el: e.currentTarget, key: "letterSubject" }; }} onChange={(e) => onChange({ letterSubject: e.target.value })} />

      <label className="form-label">Formule d&apos;appel</label>
      <input className="form-input" value={tpl.letterGreeting} disabled={disabled}
        onFocus={(e) => { activeRef.current = { el: e.currentTarget, key: "letterGreeting" }; }} onChange={(e) => onChange({ letterGreeting: e.target.value })} />

      <label className="form-label">Corps de la lettre</label>
      <textarea className="form-textarea" rows={8} value={tpl.letterBody} disabled={disabled}
        onFocus={(e) => { activeRef.current = { el: e.currentTarget, key: "letterBody" }; }} onChange={(e) => onChange({ letterBody: e.target.value })} />

      <label className="form-label">Formule de politesse</label>
      <textarea className="form-textarea" rows={2} value={tpl.letterSignoff} disabled={disabled}
        onFocus={(e) => { activeRef.current = { el: e.currentTarget, key: "letterSignoff" }; }} onChange={(e) => onChange({ letterSignoff: e.target.value })} />

      <label className="form-label">Objet de l&apos;email</label>
      <input className="form-input" value={tpl.emailSubject} disabled={disabled}
        onFocus={(e) => { activeRef.current = { el: e.currentTarget, key: "emailSubject" }; }} onChange={(e) => onChange({ emailSubject: e.target.value })} />

      <label className="form-label">Corps de l&apos;email</label>
      <textarea className="form-textarea" rows={6} value={tpl.emailBody} disabled={disabled}
        onFocus={(e) => { activeRef.current = { el: e.currentTarget, key: "emailBody" }; }} onChange={(e) => onChange({ emailBody: e.target.value })} />
    </div>
  );
}
