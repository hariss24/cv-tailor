"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDocStore } from "@/state/docStore";
import { DEFAULT_RESUME, type Resume } from "@/lib/resume/schema";
import { toast, uiAlert, uiConfirm, uiPrompt } from "@/state/uiStore";
import { saveHistoryEntry } from "@/lib/storage/db";

const STORAGE_KEY_APIKEY = "userApiKey";

/**
 * Barre du haut : logo, nom du fichier PDF, et actions globales
 * (Nouveau CV, Historique, thème, paramètres API, conversion PDF).
 * Porté du design original Flask (templates/index.html + static/css/main.css).
 */
export default function TopBar() {
  const docType = useDocStore((s) => s.docType);
  const templateId = useDocStore((s) => s.templateId);
  const json = useDocStore((s) => s.json);
  const setJson = useDocStore((s) => s.setJson);
  const [busy, setBusy] = useState(false);

  // Initialisation du thème depuis localStorage.
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const filename = `${(json as Resume).name?.trim() || docType} - ${docType}.pdf`;

  const toggleTheme = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const onNewCv = async () => {
    if (!(await uiConfirm("Repartir d'un CV vierge ? Le contenu actuel sera remplacé.", "Nouveau CV"))) return;
    setJson(structuredClone(DEFAULT_RESUME));
    toast("Nouveau CV.", "success");
  };

  const onSettings = async () => {
    const current = localStorage.getItem(STORAGE_KEY_APIKEY) || "";
    const v = await uiPrompt(
      "Collez votre clé API (Gemini ou Anthropic). Laissez vide pour utiliser la clé serveur.",
      current,
      "Paramètres API"
    );
    if (v === null) return;
    if (v.trim()) {
      localStorage.setItem(STORAGE_KEY_APIKEY, v.trim());
      toast("Clé API enregistrée.", "success");
    } else {
      localStorage.removeItem(STORAGE_KEY_APIKEY);
      toast("Clé API effacée (clé serveur utilisée).", "success");
    }
  };

  const onConvert = async () => {
    const { html, css, atsBoost } = useDocStore.getState();
    const name = (json as Resume).name?.trim() || docType;
    const boostKeywords = atsBoost.enabled ? atsBoost.keywords : [];
    setBusy(true);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, css, filename: `${name} - ${docType}`, boostKeywords }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Échec de la conversion." }));
        await uiAlert(error ?? "Échec de la conversion.", "Conversion PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name} - ${docType}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("PDF téléchargé.", "success");

      await saveHistoryEntry({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        doc_type: docType,
        company: "",
        role: "",
        job_desc: "",
        filename: `${name} - ${docType}.pdf`,
        notes: "",
        pdf_views: 1,
        editor_reloads: 0,
        last_viewed_at: new Date().toISOString(),
        html,
        css,
        json: structuredClone(json),
        templateId,
      });
    } catch {
      await uiAlert("Impossible de joindre le serveur de conversion.", "Conversion PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="topbar">
      <div className="logo-badge">
        <div className="logo-icon"><div className="logo-icon-inner">F</div></div>
        <div className="logo-text">
          <span className="logo-title">CV Forge</span>
          <span className="logo-sub">HTML → PDF</span>
        </div>
      </div>

      <div className="topbar-pill" title="Nom du fichier PDF">{filename}</div>

      <div className="topbar-actions">
        <button type="button" className="btn-nav" onClick={onNewCv}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nouveau CV
        </button>

        <Link href="/history" className="btn-nav">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
          Historique
        </Link>

        <div id="btn-theme" role="button" tabIndex={0} title="Basculer thème clair/sombre" aria-label="Basculer thème" onClick={toggleTheme} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleTheme(); }}>
          <span className="toggle-icon toggle-sun">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
          </span>
          <span className="toggle-knob"></span>
          <span className="toggle-icon toggle-moon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          </span>
        </div>

        <button id="btn-settings" type="button" title="Paramètres API" onClick={onSettings}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>

        <button className="go go-top" type="button" onClick={onConvert} disabled={busy}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {busy ? "Conversion…" : "Convertir en PDF"}
        </button>
      </div>
    </header>
  );
}
