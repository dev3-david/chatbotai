import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import { EMBEDDING_DIMENSIONS } from "./types";

// Multilingual (50+ languages incl. Hebrew), 384 dimensions.
const MODEL = process.env.EMBEDDING_MODEL ?? "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
// q8 = 8-bit quantised weights: ~4x smaller download, negligible quality loss for matching.
const DTYPE = (process.env.EMBEDDING_DTYPE ?? "q8") as "fp32" | "fp16" | "q8";

// Keep the downloaded model inside the project, not in node_modules.
env.cacheDir = process.env.TRANSFORMERS_CACHE ?? "./.cache/transformers";

declare global {
  var __embedderPromise: Promise<FeatureExtractionPipeline> | undefined;
}

function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!globalThis.__embedderPromise) {
    globalThis.__embedderPromise = pipeline("feature-extraction", MODEL, {
      dtype: DTYPE,
    }) as Promise<FeatureExtractionPipeline>;
  }
  return globalThis.__embedderPromise;
}

/**
 * Turn text into a 384-dimension unit vector.
 * Mean pooling + L2 normalisation, so cosine similarity == dot product.
 * Swap this one function to move to a hosted embedding API.
 */
export async function embed(text: string): Promise<number[]> {
  const embedder = await getEmbedder();
  const output = await embedder(text.trim(), { pooling: "mean", normalize: true });
  const vector = Array.from(output.data as Float32Array);
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${vector.length}`);
  }
  return vector;
}

/** Dot product of two unit vectors == cosine similarity. */
export function cosine(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
