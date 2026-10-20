import type { ObjectId } from "mongodb";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface DepartmentDoc {
  _id: ObjectId;
  slug: string;
  name: string;
  createdAt: Date;
}

/**
 * One answer with all the ways customers may ask for it.
 * Lives in the `qa` collection. The embeddings live in `qa_questions`,
 * one document per variation, so the vector index sees one vector per doc.
 */
export interface QaDoc {
  _id: ObjectId;
  department: string; // department slug
  /** Question variations, in English or Hebrew. The first one is the primary. */
  questions: string[];
  /** Written in whichever language the admin typed. Returned as-is. */
  answer: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** One question variation with its vector. `qa_questions` collection. */
export interface QuestionDoc {
  _id: ObjectId;
  qaId: ObjectId;
  department: string;
  text: string;
  embedding: number[]; // 384 floats, L2-normalised
  updatedAt: Date;
}

/** Q&A entry as sent to the UI: string id. */
export interface QaItem {
  id: string;
  department: string;
  questions: string[];
  answer: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHit {
  id: string;
  department: string;
  /** The variation that matched best. */
  matchedQuestion: string;
  questions: string[];
  answer: string;
  tags: string[];
  /** Cosine similarity in 0..1 */
  score: number;
}

export const COLLECTIONS = {
  users: "users",
  departments: "departments",
  qa: "qa",
  questions: "qa_questions",
} as const;

export const VECTOR_INDEX_NAME = "qa_vector";
export const EMBEDDING_DIMENSIONS = 384;
export const MAX_QUESTION_VARIATIONS = 20;
