"use client";

import { useEffect, useRef, useState } from "react";
import { useDocStore } from "@/state/docStore";
import { mergeHtml } from "@/lib/resume/mergeHtml";

interface DiffModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DiffModal({ open, onClose }: DiffModalProps) {
  const tailorBefore = useDocStore((s) => s.tailorBefore);
  const currentHtml = useDocStore((s) => s.html);
  const currentCss = useDocStore((s) => s.css);

  const [srcBefore, setSrcBefore] = useState("");
  const [srcAfter, setSrcAfter] = useState("");
  const beforeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (!open || !tailorBefore) return;

    const bHtml = mergeHtml(tailorBefore.html, tailorBefore.css);
    const aHtml = mergeHtml(currentHtml, currentCss);

    // Simulate injectZoom based on clientWidth.
    // React approach: wait for layout, then read clientWidth.
    requestAnimationFrame(() => {
      const frameWidth = beforeRef.current?.clientWidth || 793; // 793 is A4 width at 96dpi
      const zoom = Math.min(1, Math.max(0.3, (frameWidth - 10) / 793));

      const injectZoom = (h: string) => {
        if (zoom >= 1) return h;
        return h.replace(/<\/head>/i, `<style>html,body{zoom:${zoom.toFixed(3)};}</style></head>`);
      };

      setSrcBefore(injectZoom(bHtml));
      setSrcAfter(injectZoom(aHtml));
    });
  }, [open, tailorBefore, currentHtml, currentCss]);

  if (!open || !tailorBefore) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: 'flex' }}>
      <div className="modal diff-modal" onClick={(e) => e.stopPropagation()} style={{ width: '90vw', maxWidth: '1400px', height: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-panel)' }}>
        <div className="modal-header">
          <h2>Différence (Avant / Après)</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className="modal-body" style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Avant adaptation</h3>
            <div style={{ flex: 1, border: '1px solid var(--border)', background: 'white' }}>
              <iframe
                ref={beforeRef}
                srcDoc={srcBefore}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Aperçu avant"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Après adaptation</h3>
            <div style={{ flex: 1, border: '1px solid var(--border)', background: 'white' }}>
              <iframe
                srcDoc={srcAfter}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Aperçu après"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
