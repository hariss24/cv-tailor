import { NextResponse } from "next/server";
import { hasServerKey, serverKeyPreview, GEMINI_MODEL } from "@/lib/ai/clients";

// Lit l'env serveur à chaque requête (clé API) → pas de mise en cache statique.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Statut de configuration IA. Port de `/api/status` (sans le quota : la gestion de
 * quota serveur — Upstash — est reportée, cf. plan Phase 4 / Phase 7).
 */
export function GET(): Response {
  return NextResponse.json({
    server_key_configured: hasServerKey(),
    server_key_preview: serverKeyPreview(),
    model: GEMINI_MODEL,
  });
}
