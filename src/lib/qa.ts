import { ObjectId, type Filter } from "mongodb";
import { cosine, embed } from "./embeddings";
import { getDb } from "./mongodb";
import {
  COLLECTIONS,
  VECTOR_INDEX_NAME,
  type QaDoc,
  type QaItem,
  type QuestionDoc,
  type SearchHit,
} from "./types";

const PAGE_SIZE = 20;
const FALLBACK_SCAN_LIMIT = 10000;

function toItem(doc: QaDoc): QaItem {
  return {
    id: doc._id.toHexString(),
    department: doc.department,
    questions: doc.questions ?? [],
    answer: doc.answer ?? "",
    tags: doc.tags ?? [],
    createdBy: doc.createdBy,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

/** Trim, drop empties and duplicates, keep order. */
export function normaliseQuestions(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of raw) {
    const text = q.trim().replace(/\s+/g, " ");
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

// ---------- Admin CRUD ----------

export interface QaPage {
  items: QaItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listQa(department: string, query = "", page = 1): Promise<QaPage> {
  const db = await getDb();
  const col = db.collection<QaDoc>(COLLECTIONS.qa);
  const filter: Filter<QaDoc> = { department };
  if (query.trim()) {
    const rx = new RegExp(escapeRegex(query.trim()), "i");
    filter.$or = [{ questions: rx }, { answer: rx }, { tags: rx }];
  }
  const safePage = Math.max(1, page);
  const [docs, total] = await Promise.all([
    col
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip((safePage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    col.countDocuments(filter),
  ]);
  return { items: docs.map(toItem), total, page: safePage, pageSize: PAGE_SIZE };
}

export async function getQa(id: string): Promise<QaItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection<QaDoc>(COLLECTIONS.qa).findOne({ _id: new ObjectId(id) });
  return doc ? toItem(doc) : null;
}

export interface QaInput {
  department: string;
  questions: string[];
  answer: string;
  tags: string[];
}

/**
 * Writes one `qa_questions` document per variation. Embeddings of unchanged
 * texts are reused, so editing an answer or adding one variation does not
 * re-embed everything.
 */
async function syncQuestions(qaId: ObjectId, department: string, questions: string[]): Promise<void> {
  const db = await getDb();
  const col = db.collection<QuestionDoc>(COLLECTIONS.questions);
  const existing = await col.find({ qaId }).toArray();
  const byText = new Map(existing.map((q) => [q.text, q.embedding]));

  const now = new Date();
  const docs: QuestionDoc[] = [];
  for (const text of questions) {
    const embedding = byText.get(text) ?? (await embed(text));
    docs.push({ qaId, department, text, embedding, updatedAt: now } as QuestionDoc);
  }

  await col.deleteMany({ qaId });
  if (docs.length > 0) await col.insertMany(docs);
}

export async function createQa(input: QaInput, createdBy: string): Promise<string> {
  const db = await getDb();
  const now = new Date();
  const res = await db.collection<QaDoc>(COLLECTIONS.qa).insertOne({
    ...input,
    createdBy,
    createdAt: now,
    updatedAt: now,
  } as QaDoc);
  await syncQuestions(res.insertedId, input.department, input.questions);
  return res.insertedId.toHexString();
}

export async function updateQa(id: string, input: QaInput): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const _id = new ObjectId(id);
  const db = await getDb();
  const res = await db
    .collection<QaDoc>(COLLECTIONS.qa)
    .updateOne({ _id }, { $set: { ...input, updatedAt: new Date() } });
  if (res.matchedCount !== 1) return false;
  await syncQuestions(_id, input.department, input.questions);
  return true;
}

export async function deleteQa(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const _id = new ObjectId(id);
  const db = await getDb();
  await db.collection<QuestionDoc>(COLLECTIONS.questions).deleteMany({ qaId: _id });
  const res = await db.collection<QaDoc>(COLLECTIONS.qa).deleteOne({ _id });
  return res.deletedCount === 1;
}

// ---------- Customer search ----------

interface RawHit {
  qaId: ObjectId;
  text: string;
  score: number;
}

let vectorIndexUnavailableLogged = false;

/**
 * Semantic search. Every question variation is a vector in `qa_questions`;
 * the best variation per answer wins, and the top `limit` answers are returned.
 * 1. Atlas $vectorSearch (fast, indexed), optionally filtered by department.
 * 2. Fallback: in-process cosine similarity. Works on any MongoDB (local,
 *    Docker, or Atlas before the index exists); fine for thousands of rows.
 */
export async function searchQa(question: string, department?: string, limit = 3): Promise<SearchHit[]> {
  const queryVector = await embed(question);
  const db = await getDb();
  const qcol = db.collection<QuestionDoc>(COLLECTIONS.questions);

  let raw: RawHit[] | null = null;
  try {
    const candidates = limit * 5; // several variations may belong to one answer
    raw = await qcol
      .aggregate<RawHit>([
        {
          $vectorSearch: {
            index: VECTOR_INDEX_NAME,
            path: "embedding",
            queryVector,
            numCandidates: Math.max(100, candidates * 20),
            limit: candidates,
            ...(department ? { filter: { department } } : {}),
          },
        },
        { $project: { _id: 0, qaId: 1, text: 1, score: { $meta: "vectorSearchScore" } } },
      ])
      .toArray();
    // Atlas reports cosine as (1 + cos) / 2; convert back to plain cosine.
    raw = raw.map((h) => ({ ...h, score: 2 * h.score - 1 }));
  } catch (err) {
    if (!vectorIndexUnavailableLogged) {
      vectorIndexUnavailableLogged = true;
      console.warn(
        `[qa] $vectorSearch unavailable (${(err as Error).message.split("\n")[0]}). ` +
          "Falling back to in-process cosine similarity. Run `npm run vector-index` on Atlas.",
      );
    }
  }

  if (raw === null) {
    const filter: Filter<QuestionDoc> = department ? { department } : {};
    const docs = await qcol
      .find(filter, { projection: { qaId: 1, text: 1, embedding: 1 } })
      .limit(FALLBACK_SCAN_LIMIT)
      .toArray();
    raw = docs.map((d) => ({ qaId: d.qaId, text: d.text, score: cosine(queryVector, d.embedding) }));
  }

  // Best variation per answer, then top answers.
  const best = new Map<string, RawHit>();
  for (const h of raw) {
    const key = h.qaId.toHexString();
    const prev = best.get(key);
    if (!prev || h.score > prev.score) best.set(key, h);
  }
  const top = [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  if (top.length === 0) return [];

  const groups = await db
    .collection<QaDoc>(COLLECTIONS.qa)
    .find({ _id: { $in: top.map((h) => h.qaId) } })
    .toArray();
  const byId = new Map(groups.map((g) => [g._id.toHexString(), g]));

  return top.flatMap((h) => {
    const g = byId.get(h.qaId.toHexString());
    if (!g) return []; // orphaned variation; ignore
    return [
      {
        id: g._id.toHexString(),
        department: g.department,
        matchedQuestion: h.text,
        questions: g.questions ?? [],
        answer: g.answer ?? "",
        tags: g.tags ?? [],
        score: h.score,
      },
    ];
  });
}
