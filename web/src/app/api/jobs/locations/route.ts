import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Result = { kind: "commune" | "region"; code: string; label: string };

interface GeoCommune { nom: string; code: string; codesPostaux?: string[] }
interface GeoRegion { nom: string; code: string }

const COMMUNES_URL = "https://geo.api.gouv.fr/communes";
const REGIONS_URL = "https://geo.api.gouv.fr/regions";

async function fetchJson<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

/**
 * Autocomplétion de lieu (proxy geo.api.gouv.fr, sans auth). Renvoie des codes INSEE
 * compatibles France Travail : communes (avec code postal principal) + régions.
 */
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [communes, regions] = await Promise.all([
    fetchJson<GeoCommune>(`${COMMUNES_URL}?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux&boost=population&limit=8`),
    fetchJson<GeoRegion>(`${REGIONS_URL}?nom=${encodeURIComponent(q)}`),
  ]);

  const results: Result[] = [
    ...communes.map((c) => ({
      kind: "commune" as const,
      code: c.code,
      label: c.codesPostaux?.[0] ? `${c.nom} (${c.codesPostaux[0]})` : c.nom,
    })),
    ...regions.map((r) => ({ kind: "region" as const, code: r.code, label: r.nom })),
  ];

  return NextResponse.json({ results });
}
