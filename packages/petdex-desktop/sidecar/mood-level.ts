export const MOOD_LEVELS = [
  "energetic",
  "normal",
  "tired",
  "exhausted",
  "dying",
] as const;

export type MoodLevel = (typeof MOOD_LEVELS)[number];

export const MOOD_LEVEL_SET: ReadonlySet<string> = new Set(MOOD_LEVELS);

// Continuous fatigue (0..1) -> discrete level. Boundaries keep
// "normal" as the wide center band while extremes remain explicit.
export function fatigueToLevel(fatigue: number): MoodLevel {
  if (fatigue < 0.2) return "energetic";
  if (fatigue < 0.45) return "normal";
  if (fatigue < 0.7) return "tired";
  if (fatigue < 0.9) return "exhausted";
  return "dying";
}

// Mid-band representative for callers that POST a discrete level
// without a continuous fatigue value.
export function levelToFatigue(level: string): number {
  switch (level) {
    case "energetic":
      return 0.1;
    case "normal":
      return 0.32;
    case "tired":
      return 0.57;
    case "exhausted":
      return 0.8;
    case "dying":
      return 0.95;
    default:
      return 0.32;
  }
}
