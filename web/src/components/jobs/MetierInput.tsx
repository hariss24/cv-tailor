"use client";

import { useRef, useState } from "react";

type Suggestion = { label: string; rome: string };

/**
 * Champ « Poste(s) recherché(s) » : tags libres + autocomplétion sur les appellations
 * officielles ROME (France Travail). Choisir une suggestion ajoute l'intitulé officiel ;
 * la saisie libre (Entrée) reste possible pour un mot-clé hors référentiel.
 */
export function MetierInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function add(label: string) {
    const t = label.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setDraft("");
    setSuggestions([]);
    setOpen(false);
  }

  function onType(next: string) {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    if (next.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/jobs/metiers?q=${encodeURIComponent(next)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 220);
  }

  return (
    <div className="jf-tags-field">
      {values.length > 0 && (
        <div className="jf-tags">
          {values.map((v) => (
            <span key={v} className="jf-tag">
              {v}
              <button type="button" aria-label={`Retirer ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="loc-input-wrap">
        <input
          type="text"
          className="ui-input"
          placeholder="Ex. Webmaster, Chargé SEO…  (Entrée pour ajouter)"
          value={draft}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
          aria-label="Poste recherché"
        />
        {open && suggestions.length > 0 && (
          <ul className="loc-suggestions" role="listbox">
            {suggestions.map((s) => (
              <li key={`${s.rome}-${s.label}`}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s.label)}>
                  <span>{s.label}</span>
                  <span className="loc-kind">{s.rome}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
