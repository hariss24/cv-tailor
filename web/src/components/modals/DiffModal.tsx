"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDocStore } from "@/state/docStore";
import { generateResumePdfBlob } from "@/lib/pdfgen/generatePdf";
import { pdfToImages } from "@/lib/pdf/pdfToImages";
import { useEscapeClose } from "@/lib/useEscapeClose";
import type { Resume } from "@/lib/resume/schema";
import type { PdfTemplateId } from "@/lib/pdfgen/ResumeDocument";

interface DiffModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = "curtain" | "cols";
type Side = "before" | "after";

/**
 * Vue immersive « Avant / Après ». Portalisée sur `document.body` car la sheet
 * parente porte un `transform` (un `position:fixed` descendant y serait ancré).
 * Les deux CV sont rendus en images `data:` (via `pdfToImages`) : même ratio A4,
 * donc superposables au pixel pour le mode « rideau » (clip-path piloté par la
 * poignée), et affichables en grand côte à côte.
 */
export default function DiffModal({ open, onClose }: DiffModalProps) {
  const tailorBefore = useDocStore((s) => s.tailorBefore);
  const currentJson = useDocStore((s) => s.json);
  const currentTemplate = useDocStore((s) => s.templateId);

  const [beforeImgs, setBeforeImgs] = useState<string[] | null>(null);
  const [afterImgs, setAfterImgs] = useState<string[] | null>(null);
  const [mode, setMode] = useState<Mode>("curtain");
  const [pos, setPos] = useState(50); // position de la poignée (%) en mode rideau
  const [side, setSide] = useState<Side>("after"); // colonne visible sur mobile en mode côte à côte

  const curtainRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!open || !tailorBefore) return;
    let cancelled = false;

    const toImages = async (json: Resume, tpl: PdfTemplateId) => {
      const blob = await generateResumePdfBlob(json, tpl);
      const file = new File([blob], "cv.pdf", { type: "application/pdf" });
      return pdfToImages(file);
    };

    void (async () => {
      setBeforeImgs(null);
      setAfterImgs(null);
      const [b, a] = await Promise.all([
        toImages(tailorBefore.json as Resume, (tailorBefore.templateId || "sobre") as PdfTemplateId),
        toImages(currentJson as Resume, currentTemplate as PdfTemplateId),
      ]);
      if (!cancelled) { setBeforeImgs(b); setAfterImgs(a); }
    })().catch(console.error);

    return () => { cancelled = true; };
  }, [open, tailorBefore, currentJson, currentTemplate]);

  useEscapeClose(open && !!tailorBefore, onClose);

  if (!open || !tailorBefore || typeof document === "undefined") return null;

  const ready = beforeImgs && afterImgs;

  // --- Poignée du rideau : glisser souris/tactile ---
  const moveHandle = (clientX: number) => {
    const el = curtainRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };
  const onHandleDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    moveHandle(e.clientX);
  };
  const onHandleMove = (e: React.PointerEvent) => {
    if (draggingRef.current) moveHandle(e.clientX);
  };
  const onHandleUp = () => { draggingRef.current = false; };

  const renderPages = (imgs: string[], label: string) =>
    imgs.map((src, i) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={i} src={src} alt={`${label} — page ${i + 1}`} className="diffx-page" draggable={false} />
    ));

  const loader = (
    <div className="diffx-loading">
      <div className="diffx-spinner" />
      <span>Génération des aperçus…</span>
    </div>
  );

  return createPortal(
    <div className="diffx-overlay" role="dialog" aria-modal="true" aria-label="Avant / Après">
      <header className="diffx-bar">
        <span className="diffx-bar__title">Avant&nbsp;/&nbsp;Après</span>

        <div className="diffx-seg" role="tablist" aria-label="Mode de comparaison">
          <span className="diffx-seg__knob" data-mode={mode} aria-hidden="true" />
          <button
            type="button"
            role="tab"
            aria-selected={mode === "curtain"}
            className={`diffx-seg__btn${mode === "curtain" ? " is-active" : ""}`}
            onClick={() => setMode("curtain")}
          >
            Rideau
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "cols"}
            className={`diffx-seg__btn${mode === "cols" ? " is-active" : ""}`}
            onClick={() => setMode("cols")}
          >
            Côte à côte
          </button>
        </div>

        <button type="button" className="diffx-close" onClick={onClose} aria-label="Fermer">
          &times;
        </button>
      </header>

      <div className="diffx-stage">
        {!ready ? (
          loader
        ) : mode === "curtain" ? (
          <div
            ref={curtainRef}
            className="diffx-curtain"
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
          >
            <span className="diffx-tag diffx-tag--before">Avant</span>
            <span className="diffx-tag diffx-tag--after">Après</span>

            {/* Couche de base = Après (dans le flux, donne sa hauteur) */}
            <div className="diffx-layer">{renderPages(afterImgs!, "Après")}</div>
            {/* Couche superposée = Avant, découpée jusqu'à la poignée */}
            <div className="diffx-layer diffx-layer--over" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              {renderPages(beforeImgs!, "Avant")}
            </div>

            <div className="diffx-handle" style={{ left: `${pos}%` }} onPointerDown={onHandleDown} role="slider" aria-label="Curseur de comparaison" aria-valuenow={Math.round(pos)} aria-valuemin={0} aria-valuemax={100} tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
                if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
              }}
            >
              <span className="diffx-handle__grip" />
            </div>
          </div>
        ) : (
          <div className="diffx-colswrap">
            {/* Bascule Avant/Après visible sur mobile uniquement (mode côte à côte) */}
            <div className="diffx-mobseg" role="tablist" aria-label="Colonne visible">
              <button type="button" className={`diffx-mobseg__btn${side === "before" ? " is-active" : ""}`} onClick={() => setSide("before")}>Avant</button>
              <button type="button" className={`diffx-mobseg__btn${side === "after" ? " is-active" : ""}`} onClick={() => setSide("after")}>Après</button>
            </div>

            <div className="diffx-cols">
              <div className={`diffx-col${side === "before" ? " is-active" : ""}`}>
                <span className="diffx-tag diffx-tag--before">Avant</span>
                <div className="diffx-layer">{renderPages(beforeImgs!, "Avant")}</div>
              </div>
              <div className={`diffx-col${side === "after" ? " is-active" : ""}`}>
                <span className="diffx-tag diffx-tag--after">Après</span>
                <div className="diffx-layer">{renderPages(afterImgs!, "Après")}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
