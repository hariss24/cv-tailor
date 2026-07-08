"use client";

import { useEffect, useState } from "react";

/**
 * Wrapper client du panneau éditeur. Desktop : simple <section> inchangée.
 * Mobile (≤900px, via CSS) : la section devient un tiroir plein écran,
 * ouvert/fermé par l'événement `cvforge:toggle-form` (déclenché par le
 * bouton ✏️ de la TopBar — même pattern que `cvforge:open-snapshots`).
 */
export default function EditorDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener("cvforge:toggle-form", toggle);
    return () => window.removeEventListener("cvforge:toggle-form", toggle);
  }, []);

  return (
    <section className={`pane editor-pane${open ? " editor-pane--open" : ""}`}>
      {children}
      <button type="button" className="editor-drawer-close go" onClick={() => setOpen(false)}>
        ✓ Terminé
      </button>
    </section>
  );
}
