"use client";

import { useEffect } from "react";
import { useAutoDraft } from "@/lib/storage/useAutoDraft";
import { takeSnapshot } from "@/lib/storage/snapshots";

/**
 * Effets globaux de l'application (sans rendu) :
 * - chargement/sauvegarde automatique du brouillon par type de document ;
 * - snapshot automatique toutes les 5 minutes.
 * Extrait de l'ancien `Toolbar` lors de la refonte UI.
 */
export default function DraftManager() {
  useAutoDraft();

  useEffect(() => {
    const interval = setInterval(() => {
      takeSnapshot("Auto-save");
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
