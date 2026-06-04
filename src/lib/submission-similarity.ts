type SimilaritySignal = {
  visualDistance?: number | null;
  semanticScore?: number | null;
};

export const SUBMISSION_SIMILARITY_MIN_SCORE = 0.9;

// Visual dHash hamming threshold. 0 = identical, 64 = inverted. Keep only
// matches whose displayed similarity score is at least 90%.
export const SUBMISSION_SIMILARITY_VISUAL_THRESHOLD = Math.floor(
  64 * (1 - SUBMISSION_SIMILARITY_MIN_SCORE),
);

// Cosine similarity threshold (0..1). Gemini embeddings produced too many
// loose character/style matches below 0.90, so stay above that band.
export const SUBMISSION_SIMILARITY_SEMANTIC_THRESHOLD =
  SUBMISSION_SIMILARITY_MIN_SCORE;

export const SUBMISSION_SIMILARITY_MAX_RESULTS = 12;
export const SUBMISSION_NEAR_VISUAL_DUPLICATE_THRESHOLD = 6;
export const SUBMISSION_NEAR_EXACT_VISUAL_THRESHOLD = 3;
export const SUBMISSION_DUPLICATE_REVIEW_SEMANTIC_HOLD_THRESHOLD = 0.88;
export const SUBMISSION_SEMANTIC_HOLD_THRESHOLD = 0.9;
export const SUBMISSION_STRONG_SEMANTIC_CORROBORATION_THRESHOLD = 0.95;

export function passesVisualSimilarityThreshold(
  match: SimilaritySignal,
): boolean {
  return (
    typeof match.visualDistance === "number" &&
    match.visualDistance <= SUBMISSION_SIMILARITY_VISUAL_THRESHOLD
  );
}

export function passesSemanticSimilarityThreshold(
  match: SimilaritySignal,
): boolean {
  return (
    typeof match.semanticScore === "number" &&
    match.semanticScore >= SUBMISSION_SIMILARITY_SEMANTIC_THRESHOLD
  );
}

export function hasCurrentSimilaritySignal(match: SimilaritySignal): boolean {
  return (
    passesVisualSimilarityThreshold(match) ||
    passesSemanticSimilarityThreshold(match)
  );
}

export function similarityStrengthScore(match: SimilaritySignal): number {
  // Bigger = more suspicious. Visual identity dominates.
  let score = 0;
  if (typeof match.visualDistance === "number") {
    score +=
      (SUBMISSION_SIMILARITY_VISUAL_THRESHOLD - match.visualDistance) * 5;
  }
  if (typeof match.semanticScore === "number") {
    score +=
      (match.semanticScore - SUBMISSION_SIMILARITY_SEMANTIC_THRESHOLD) * 100;
  }
  return score;
}

export function visualDistanceSimilarityScore(visualDistance: number): number {
  return clamp01(1 - visualDistance / 64);
}

export function formatSimilarityPercent(score: number): string {
  return `${Math.floor(clamp01(score) * 100)}%`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
