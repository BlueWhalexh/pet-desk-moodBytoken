type BadgeVariant = "hot" | "new" | "limited" | "verified" | "top-creator";
type BadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface PetBadgeConfig {
  variant: BadgeVariant;
  position: BadgePosition;
}

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getDeterministicBadges(
  petSlug: string,
  installCount: number,
): PetBadgeConfig[] {
  if (installCount > 10000) {
    return [
      { variant: "hot", position: "top-left" },
      { variant: "verified", position: "top-right" },
    ];
  }

  if (installCount > 5000) {
    return [{ variant: "top-creator", position: "top-right" }];
  }

  const h = hashSlug(petSlug);
  const bucket = h % 10;

  if (bucket === 0) {
    return [{ variant: "new", position: "top-left" }];
  }

  if (bucket === 1) {
    return [{ variant: "hot", position: "top-left" }];
  }

  return [];
}
