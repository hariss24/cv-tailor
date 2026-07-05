import { NextResponse } from "next/server";
import { complete } from "@/lib/ai/clients";
import { SYSTEM_PACK } from "@/lib/ai/prompts";
import { parseAiJson } from "@/lib/ai/json";
import { aiErrorResponse } from "@/lib/ai/http";
import { normalizeLetter } from "@/lib/resume/normalize";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  cv_json?: unknown;
  job_desc?: string;
  company?: string;
  role?: string;
  /** Date du jour formatée côté client (fuseau de l'utilisateur) — pour dater la lettre. */
  today?: string;
};

/** Pack candidature (lettre structurée JSON + email) cohérent avec le CV JSON en entrée. */
export async function POST(req: Request): Promise<Response> {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const cvJsonStr = JSON.stringify(body.cv_json ?? {});
  const jobDesc = (body.job_desc ?? "").trim();
  if (cvJsonStr === "{}" || !jobDesc) {
    return NextResponse.json({ error: "CV et offre d'emploi requis." }, { status: 400 });
  }

  let content = `CV (JSON) :\n${cvJsonStr}`;
  content += `\n\nOffre d'emploi :\n${jobDesc}`;
  if (body.company?.trim()) content += `\n\nEntreprise visée : ${body.company.trim()}`;
  if (body.role?.trim()) content += `\n\nPoste visé : ${body.role.trim()}`;
  const today =
    body.today?.trim() ||
    new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  content += `\n\nDate du jour (à utiliser pour dater la lettre) : ${today}`;

  const userKey = req.headers.get("x-api-key")?.trim() || null;

  try {
    const raw = await complete([{ role: "user", content }], SYSTEM_PACK, userKey);
    const result = parseAiJson(raw);
    if (
      typeof result !== "object" ||
      result === null ||
      !("letter" in result) ||
      !("email" in result)
    ) {
      throw new Error("Réponse IA invalide : champs 'letter' et 'email' attendus.");
    }
    const r = result as Record<string, unknown>;
    const letter = normalizeLetter(r.letter);
    return NextResponse.json({
      letter,
      email: String(r.email ?? "").trim(),
    });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
