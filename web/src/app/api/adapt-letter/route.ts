import { NextResponse } from "next/server";
import { aiClient } from "@/lib/ai/client";
import { SYSTEM_ADAPT_LETTER } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  try {
    const { bodyLetter, jobText, resumeJson } = await req.json();
    if (!bodyLetter || !jobText || !resumeJson) {
      return NextResponse.json({ error: "Missing bodyLetter, jobText or resumeJson" }, { status: 400 });
    }

    const prompt = `OFFRE D'EMPLOI :\n${jobText}\n\nCV :\n${resumeJson}\n\nLETTRE DE MOTIVATION (CORPS) :\n${bodyLetter}`;

    const res = await aiClient.generateObject<{ body: string }>({
      system: SYSTEM_ADAPT_LETTER,
      prompt,
    });

    return NextResponse.json({ body: res.body });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
