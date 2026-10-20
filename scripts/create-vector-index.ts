/**
 * Creates the Atlas Vector Search index on the qa_questions collection.
 * Requires MongoDB Atlas (M0 free tier is fine). Takes about a minute to build.
 *
 *   npm run vector-index
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { getDb, closeDb } = await import("../src/lib/mongodb");
  const { COLLECTIONS, EMBEDDING_DIMENSIONS, VECTOR_INDEX_NAME } = await import("../src/lib/types");

  const db = await getDb();
  const col = db.collection(COLLECTIONS.questions);

  const existing = (await col.listSearchIndexes(VECTOR_INDEX_NAME).toArray().catch(() => [])) as {
    name: string;
    status?: string;
  }[];
  if (existing.length > 0) {
    console.log(`Index "${VECTOR_INDEX_NAME}" already exists (status: ${existing[0].status ?? "unknown"}).`);
    await closeDb();
    return;
  }

  const name = await col.createSearchIndex({
    name: VECTOR_INDEX_NAME,
    type: "vectorSearch",
    definition: {
      fields: [
        { type: "vector", path: "embedding", numDimensions: EMBEDDING_DIMENSIONS, similarity: "cosine" },
        { type: "filter", path: "department" },
      ],
    },
  });
  console.log(`Created vector index "${name}" on ${COLLECTIONS.questions}. It becomes queryable once Atlas finishes building it.`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
