import { NextResponse } from "next/server";
import { z } from "zod";
import { searchQa } from "@/lib/qa";

const bodySchema = z.object({
  question: z.string().trim().min(2).max(500),
});

const THRESHOLD = Number(process.env.CONFIDENCE_THRESHOLD ?? "0.5");

export interface ChatResponse {
  /** The stored answer, in whichever language the admin wrote it. */
  answer: string | null;
  confident: boolean;
  /** Cosine similarity of the best match, for tuning and logging. */
  score: number | null;
}

/**
 * Customer-facing search. Always searches every department: departments are
 * an organisational tool for admins, not something customers choose.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please send a question between 2 and 500 characters." }, { status: 400 });
  }

  try {
    const hits = await searchQa(parsed.data.question, undefined, 3);
    const best = hits[0];
    const confident = !!best && best.score >= THRESHOLD;
    const body: ChatResponse = {
      answer: confident ? best.answer : null,
      confident,
      score: best ? Number(best.score.toFixed(3)) : null,
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[api/chat]", err);
    return NextResponse.json({ error: "The assistant is unavailable right now." }, { status: 500 });
  }
}
