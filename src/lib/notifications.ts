import { db, schema } from "@/lib/db/client";

export type NotificationKind =
  | "pet_approved"
  | "pet_rejected"
  | "edit_approved"
  | "edit_rejected"
  | "feedback_replied"
  | "request_fulfilled";

type CreateInput = {
  userId: string;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  href: string;
};

function newId(): string {
  return `ntf_${crypto.randomUUID().replace(/-/g, "").slice(0, 22)}`;
}

// Fire-and-forget create. Callers should use `void create(...)` if they
// don't want to block on it; the function still surfaces errors so a
// caller that *does* await can react. Failure is best-effort: a missing
// notification is not worth aborting the underlying admin action.
export async function createNotification(input: CreateInput): Promise<void> {
  await db.insert(schema.notifications).values({
    id: newId(),
    userId: input.userId,
    kind: input.kind,
    payload: input.payload,
    href: input.href,
  });
}
