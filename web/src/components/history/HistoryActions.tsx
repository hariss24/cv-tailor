"use client";

import { useRef } from "react";
import { listHistoryEntries, saveHistoryEntry, type HistoryEntry } from "@/lib/storage/db";
import { uiAlert, toast } from "@/state/uiStore";

/**
 * Boutons Exporter / Importer de l'historique (sauvegarde JSON des entrées + leur HTML/CSS/JSON).
 * Port de `exportData`/`importData` (static/js/history.js). L'historique Next.js est stocké
 * dans une seule table Dexie (`db.history`), donc l'export/import est direct (pas de fallback serveur).
 */
export default function HistoryActions() {
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = async () => {
    const entries = await listHistoryEntries();
    if (entries.length === 0) {
      await uiAlert("Aucune entrée à exporter.", "Export");
      return;
    }
    const payload = { exported_at: new Date().toISOString(), entries };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cv-archive-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Données exportées.", "success");
  };

  const onImportFile = async (file: File | null) => {
    if (!file) return;

    let payload: unknown;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      await uiAlert("Fichier invalide : JSON mal formé.", "Import impossible");
      return;
    }

    const entries = (payload as { entries?: unknown })?.entries;
    if (!Array.isArray(entries)) {
      await uiAlert("Fichier invalide : clé « entries » manquante.", "Import impossible");
      return;
    }

    const existing = await listHistoryEntries();
    const existingIds = new Set(existing.map((e) => e.id));
    let imported = 0;

    for (const raw of entries) {
      const entry = raw as HistoryEntry;
      if (!entry || !entry.id) continue;
      if (!existingIds.has(entry.id)) {
        imported++;
        existingIds.add(entry.id);
      }
      await saveHistoryEntry(entry);
    }

    window.dispatchEvent(new CustomEvent("cvforge:history-changed"));
    await uiAlert(`Import terminé : ${imported} nouvelle(s) entrée(s) ajoutée(s).`, "Import réussi");
  };

  function toggleTheme() {
    const html = document.documentElement;
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <>
      <button type="button" className="btn-nav" onClick={() => fileRef.current?.click()}>
        ↑ Importer
      </button>
      <button type="button" className="btn-nav" onClick={onExport}>
        ↓ Exporter
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          onImportFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <button id="btn-theme" type="button" onClick={toggleTheme} title="Basculer thème clair/sombre">
        <span className="toggle-icon toggle-sun">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          </svg>
        </span>
        <span className="toggle-knob"></span>
        <span className="toggle-icon toggle-moon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </span>
      </button>
    </>
  );
}
