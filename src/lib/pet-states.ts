export type PetStateId =
  | "idle"
  | "running-right"
  | "running-left"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review";

export type PetState = {
  id: PetStateId;
  label: string;
  row: number;
  frames: number;
  durationMs: number;
  purpose: string;
};

export const petStates = [
  {
    id: "idle",
    label: "Idle",
    row: 0,
    frames: 6,
    durationMs: 1100,
    purpose: "Neutral breathing and blinking loop",
  },
  {
    id: "running-right",
    label: "Run Right",
    row: 1,
    frames: 8,
    durationMs: 1060,
    purpose: "Directional locomotion to the right",
  },
  {
    id: "running-left",
    label: "Run Left",
    row: 2,
    frames: 8,
    durationMs: 1060,
    purpose: "Directional locomotion to the left",
  },
  {
    id: "waving",
    label: "Waving",
    row: 3,
    frames: 4,
    durationMs: 700,
    purpose: "Greeting or attention gesture",
  },
  {
    id: "jumping",
    label: "Jumping",
    row: 4,
    frames: 5,
    durationMs: 840,
    purpose: "Anticipation, lift, peak, descent, settle",
  },
  {
    id: "failed",
    label: "Failed",
    row: 5,
    frames: 8,
    durationMs: 1220,
    purpose: "Readable error or sad reaction",
  },
  {
    id: "waiting",
    label: "Waiting",
    row: 6,
    frames: 6,
    durationMs: 1010,
    purpose: "Patient idle variant",
  },
  {
    id: "running",
    label: "Running",
    row: 7,
    frames: 6,
    durationMs: 820,
    purpose: "Generic in-place run loop",
  },
  {
    id: "review",
    label: "Review",
    row: 8,
    frames: 6,
    durationMs: 1030,
    purpose: "Focused inspecting or thinking loop",
  },
] as const satisfies PetState[];

export const defaultPetState = petStates[0];
