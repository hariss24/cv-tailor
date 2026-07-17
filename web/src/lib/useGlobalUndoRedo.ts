"use client";

import { useEffect } from "react";
import { useDocStore } from "@/state/docStore";
import { useHistoryStore, initHistoryTracking, type DocumentSnapshot } from "@/state/historyStore";
import { toast } from "@/state/uiStore";

let initialized = false;

export function useGlobalUndoRedo() {
  useEffect(() => {
    if (!initialized) {
      initHistoryTracking();
      initialized = true;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Monaco (mode expert) gère son propre undo : on ne veut pas interférer avec lui.
      // Cibler spécifiquement Monaco (et non tout <input>/<textarea>) : un filtre générique
      // désactivait aussi le Ctrl+Z dans les champs des formulaires (CV, lettre), qui eux
      // dépendent de ce système global — le undo natif du navigateur n'y fonctionne pas de
      // façon fiable puisque leur valeur est pilotée par le store (composants contrôlés).
      const isMonacoEditor = !!document.activeElement?.closest(".monaco-editor");
      if (isMonacoEditor) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault(); // Bloquer l'undo natif global

        const docState = useDocStore.getState();
        const currentState = {
          json: docState.json,
          templateId: docState.templateId,
        };

        if (e.shiftKey) {
          // Redo
          const nextState = useHistoryStore.getState().redo(currentState);
          if (nextState) {
            applyState(nextState);
            toast("Rétabli", "info");
          }
        } else {
          // Undo
          const prevState = useHistoryStore.getState().undo(currentState);
          if (prevState) {
            applyState(prevState);
            toast("Annulé", "info");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

function applyState(state: DocumentSnapshot) {
  // On met en pause le tracking pendant qu'on applique le retour en arrière
  // pour éviter que le Zustand .set() ne déclenche une nouvelle sauvegarde.
  useHistoryStore.getState().pause();
  
  useDocStore.setState({
    json: state.json,
    templateId: state.templateId,
  });

  // On relance le tracking après un court délai
  setTimeout(() => {
    useHistoryStore.getState().resume();
  }, 50);
}
