// All zips live on R2 now. Per-pet zips: pet.zipUrl in the DB. The
// "Download all pets" bundle: a single static URL pinned via env or a
// stable default.

const DEFAULT_ALL_PACK_URL =
  "https://pub-94495283df974cfea5e98d6a9e3fa462.r2.dev/packs/petdex-approved.zip";

export function getAllPetsPackPath(): string {
  return process.env.PETDEX_ALL_PETS_PACK_URL ?? DEFAULT_ALL_PACK_URL;
}
