"use client";

import { useState, useEffect } from "react";
import { useDocStore } from "@/state/docStore";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/resume/templates";
import type { DocType } from "@/lib/resume/schema";
import TailorModal from "@/components/modals/TailorModal";
import ChatPanel from "@/components/modals/ChatPanel";
import AtsPanel from "@/components/modals/AtsPanel";
import PackModal from "@/components/modals/PackModal";
import ImportTextModal from "@/components/modals/ImportTextModal";
import ImportPdfModal from "@/components/modals/ImportPdfModal";
import SnapshotsModal from "@/components/modals/SnapshotsModal";
import DiffModal from "@/components/modals/DiffModal";
import { takeSnapshot } from "@/lib/storage/snapshots";
import { useAutoDraft } from "@/lib/storage/useAutoDraft";

const TEMPLATE_LABELS: Record<TemplateId, string> = {
  sobre: "Sobre",
  moderne: "Moderne",
  classique: "Classique",
  minimal: "Minimal",
  graphique: "Graphique",
};

/**
 * Barre d'outils : type de document (CV / Lettre), modèle, et conversion PDF (Phase 3).
 * Composant client : lit/écrit le store.
 */
export default function Toolbar() {
  const docType = useDocStore((s) => s.docType);
  const templateId = useDocStore((s) => s.templateId);
  const tailorBefore = useDocStore((s) => s.tailorBefore);
  const setDocType = useDocStore((s) => s.setDocType);
  const setTemplate = useDocStore((s) => s.setTemplate);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [atsOpen, setAtsOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);

  // Initialisation et auto-save des brouillons
  useAutoDraft();

  useEffect(() => {
    const interval = setInterval(() => {
      takeSnapshot("Auto-save");
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="toolbar">
      <label className="toolbar-field">
        <span className="toolbar-field__label">Document</span>
        <select
          className="toolbar-select"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
        >
          <option value="CV">CV</option>
          <option value="Lettre">Lettre</option>
        </select>
      </label>

      <label className="toolbar-field">
        <span className="toolbar-field__label">Modèle</span>
        <select
          className="toolbar-select"
          value={templateId}
          onChange={(e) => setTemplate(e.target.value as TemplateId)}
        >
          {TEMPLATE_IDS.map((id) => (
            <option key={id} value={id}>
              {TEMPLATE_LABELS[id]}
            </option>
          ))}
        </select>
      </label>

      {docType === "CV" ? (
        <button
          className="form-btn-mini toolbar-tailor"
          type="button"
          onClick={() => { takeSnapshot("Avant adaptation"); setTailorOpen(true); }}
        >
          Adapter à une offre
        </button>
      ) : null}

      {docType === "CV" && tailorBefore ? (
        <button
          className="form-btn-mini toolbar-diff"
          type="button"
          onClick={() => setDiffOpen(true)}
          style={{ backgroundColor: "var(--accent)", color: "white", borderColor: "var(--accent)" }}
        >
          Différence
        </button>
      ) : null}

      {docType === "CV" ? (
        <button
          className="form-btn-mini toolbar-ats"
          type="button"
          onClick={() => setAtsOpen(true)}
        >
          Score ATS
        </button>
      ) : null}

      {docType === "CV" ? (
        <button
          className="form-btn-mini toolbar-pack"
          type="button"
          onClick={() => { takeSnapshot("Avant pack"); setPackOpen(true); }}
        >
          Pack candidature
        </button>
      ) : null}

      <button
        className="form-btn-mini toolbar-import"
        type="button"
        onClick={() => setImportOpen(true)}
      >
        Importer un texte
      </button>

      <button
        className="form-btn-mini toolbar-snapshots"
        type="button"
        onClick={() => setSnapshotsOpen(true)}
      >
        Brouillons
      </button>

      {docType === "CV" ? (
        <button
          className="form-btn-mini toolbar-import-pdf"
          type="button"
          onClick={() => setPdfOpen(true)}
        >
          Importer un PDF
        </button>
      ) : null}

      <button
        className="form-btn-mini toolbar-chat"
        type="button"
        onClick={() => { takeSnapshot("Avant chat IA"); setChatOpen(true); }}
      >
        Assistant IA
      </button>

      <TailorModal open={tailorOpen} onClose={() => setTailorOpen(false)} />
      <AtsPanel open={atsOpen} onClose={() => setAtsOpen(false)} />
      <PackModal open={packOpen} onClose={() => setPackOpen(false)} />
      <ImportTextModal open={importOpen} onClose={() => setImportOpen(false)} />
      <ImportPdfModal open={pdfOpen} onClose={() => setPdfOpen(false)} />
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      <SnapshotsModal open={snapshotsOpen} onClose={() => setSnapshotsOpen(false)} />
      <DiffModal open={diffOpen} onClose={() => setDiffOpen(false)} />
    </div>
  );
}
