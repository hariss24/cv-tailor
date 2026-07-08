import { NextResponse } from "next/server";
import { aiClient } from "@/lib/ai/client";
import { SYSTEM_EXTRACT_META } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  try {
    const { jobText } = await req.json();
    if (!jobText) {
      return NextResponse.json({ error: "Missing jobText" }, { status: 400 });
    }

    const prompt = `OFFRE D'EMPLOI :\n${jobText}`;

    const res = await aiClient.generateObject<{ company: string; role: string }>({
      system: SYSTEM_EXTRACT_META,
      prompt,
    });

    return NextResponse.json({ company: res.company, role: res.role });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
