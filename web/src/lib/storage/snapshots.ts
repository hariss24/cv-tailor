import { saveSnapshot, listSnapshots, type Snapshot } from "@/lib/storage/db";
import { useDocStore } from "@/state/docStore";

export async function takeSnapshot(customLabel?: string) {
  const { json, html, css, docType, company, role, htmlSource } = useDocStore.getState();

  // Anti-doublon : contenu identique au snapshot le plus récent → rien à sauvegarder.
  // `html` est vide en permanence sur le pipeline JSON (setJson le remet à "") : la
  // comparaison doit porter sur `json` dans ce cas, sous peine de ne jamais rien détecter.
  const [latest] = await listSnapshots();
  if (latest && latest.doc_type === docType) {
    const unchanged = htmlSource
      ? latest.html === html && latest.css === css
      : JSON.stringify(latest.json) === JSON.stringify(json);
    if (unchanged) return;
  }

  const label = customLabel || new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  const snap: Snapshot = {
    ts: Date.now(),
    label,
    html,
    css,
    // json périmé quand le HTML est la source : la restauration repartira du HTML.
    json: htmlSource ? null : structuredClone(json),
    doc_type: docType,
    company,
    role,
  };

  await saveSnapshot(snap);
}

/** Snapshot manuel (bouton « Créer un snapshot maintenant ») : libellé « Manuel · <date> ». */
export async function takeManualSnapshot() {
  const label = "Manuel · " + new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  await takeSnapshot(label);
}
