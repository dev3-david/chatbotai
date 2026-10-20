/**
 * Re-computes the embedding of every question variation with the current model.
 * Run this after changing EMBEDDING_MODEL, otherwise stored vectors and query
 * vectors come from different models and scores are meaningless.
 *
 *   npm run reembed
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { getDb, closeDb } = await import("../src/lib/mongodb");
  const { COLLECTIONS } = await import("../src/lib/types");
  const { embed } = await import("../src/lib/embeddings");
  type QuestionDoc = import("../src/lib/types").QuestionDoc;

  const db = await getDb();
  const col = db.collection<QuestionDoc>(COLLECTIONS.questions);
  const cursor = col.find({}, { projection: { text: 1 } });

  let n = 0;
  const t0 = Date.now();
  for await (const doc of cursor) {
    const embedding = await embed(doc.text);
    await col.updateOne({ _id: doc._id }, { $set: { embedding, updatedAt: new Date() } });
    n++;
    if (n % 50 === 0) console.log(`${n} variations re-embedded…`);
  }
  console.log(`Done: ${n} variation${n === 1 ? "" : "s"} re-embedded in ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
