import { describe, expect, it } from "bun:test";

import {
  buildPetEmbeddingText,
  embeddingVectorLiteral,
  PETDEX_EMBEDDING_DIMENSIONS,
  PETDEX_EMBEDDING_MODEL,
} from "@/lib/embeddings";

describe("embedding helpers", () => {
  it("uses Gemini embedding model metadata", () => {
    expect(PETDEX_EMBEDDING_MODEL).toBe("google/gemini-embedding-2");
    expect(PETDEX_EMBEDDING_DIMENSIONS).toBe(3072);
  });

  it("builds stable pet embedding text", () => {
    expect(
      buildPetEmbeddingText({
        displayName: "Sunny",
        description: "A beach friend",
        kind: "creature",
        tags: ["beach", "sun"],
        vibes: ["cozy"],
      }),
    ).toBe("Sunny\nA beach friend\ncreature\nbeach sun\ncozy");
  });

  it("formats pgvector literals", () => {
    expect(embeddingVectorLiteral([0.1, -0.2, 0])).toBe("[0.1,-0.2,0]");
  });
});
