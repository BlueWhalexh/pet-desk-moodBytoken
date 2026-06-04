import { embed } from "ai";

export const PETDEX_EMBEDDING_MODEL = "google/gemini-embedding-2";
export const PETDEX_EMBEDDING_DIMENSIONS = 3072;

const MAX_EMBEDDING_INPUT_CHARS = 8000;

export async function embedTextValue(value: string): Promise<number[] | null> {
  const input = value.trim().slice(0, MAX_EMBEDDING_INPUT_CHARS);
  if (!input) return null;

  try {
    const result = await embed({
      model: PETDEX_EMBEDDING_MODEL,
      value: input,
    });
    if (result.embedding.length !== PETDEX_EMBEDDING_DIMENSIONS) {
      console.warn(
        `[embeddings] ${PETDEX_EMBEDDING_MODEL} returned ${result.embedding.length} dimensions, expected ${PETDEX_EMBEDDING_DIMENSIONS}`,
      );
      return null;
    }
    return result.embedding;
  } catch (err) {
    console.warn(
      "[embeddings] embed failed:",
      (err as Error).message?.slice(0, 200),
    );
    return null;
  }
}

export function buildPetEmbeddingText(args: {
  displayName: string;
  description: string;
  kind: string;
  tags: string[];
  vibes: string[];
}): string {
  return [
    args.displayName,
    args.description,
    args.kind,
    args.tags.join(" "),
    args.vibes.join(" "),
  ]
    .filter(Boolean)
    .join("\n");
}

export function embeddingVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export function hasCurrentEmbeddingDimensions(
  value: unknown,
): value is number[] {
  return Array.isArray(value) && value.length === PETDEX_EMBEDDING_DIMENSIONS;
}
