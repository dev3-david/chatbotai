/**
 * Brings older `qa` documents up to the current shape. Safe to run repeatedly.
 *
 *  - `question: string` + `embedding` -> `questions: [question]` + one `qa_questions` row
 *
 *   npm run migrate
 */
import { config } from "dotenv";
import type { ObjectId } from "mongodb";

config({ path: ".env.local" });
config();

interface LegacyQa {
  _id: ObjectId;
  department: string;
  question?: string;
  embedding?: number[];
}

async function main() {
  const { getDb, closeDb } = await import("../src/lib/mongodb");
  const { COLLECTIONS } = await import("../src/lib/types");

  const db = await getDb();
  const qa = db.collection<LegacyQa>(COLLECTIONS.qa);
  const questions = db.collection(COLLECTIONS.questions);

  let moved = 0;
  for await (const doc of qa.find(
    { question: { $type: "string" } },
    { projection: { question: 1, embedding: 1, department: 1 } },
  )) {
    const text = String(doc.question);
    if (Array.isArray(doc.embedding) && doc.embedding.length > 0) {
      await questions.updateOne(
        { qaId: doc._id, text },
        { $set: { department: doc.department, embedding: doc.embedding, updatedAt: new Date() } },
        { upsert: true },
      );
    }
    await qa.updateOne({ _id: doc._id }, { $set: { questions: [text] }, $unset: { question: "", embedding: "" } });
    moved++;
  }

  console.log(`single questions moved to qa_questions: ${moved}`);
  if (moved > 0) console.log("Run `npm run reembed` if any moved row lacked an embedding.");
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
