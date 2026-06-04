type CacheOptions = {
  tags?: string[];
  revalidate?: number | false;
};

type AsyncNoArg<T> = () => Promise<T>;

// `next/cache` throws when imported by standalone Bun tests. Resolve it lazily
// so app/runtime code gets Next's persistent cache, while direct library tests
// can still execute the underlying DB function.
export function withNextDataCache<T>(
  fn: AsyncNoArg<T>,
  keyParts: string[],
  options: CacheOptions,
): AsyncNoArg<T> {
  let resolved: AsyncNoArg<T> | null = null;

  return async () => {
    resolved ??= await resolveCachedFunction(fn, keyParts, options);
    return resolved();
  };
}

async function resolveCachedFunction<T>(
  fn: AsyncNoArg<T>,
  keyParts: string[],
  options: CacheOptions,
): Promise<AsyncNoArg<T>> {
  if (process.env.PETDEX_DISABLE_NEXT_CACHE === "1") return fn;

  try {
    const { unstable_cache: unstableCache } = await import("next/cache");
    const cached = unstableCache(fn, keyParts, options) as AsyncNoArg<T>;
    return async () => {
      try {
        return await cached();
      } catch (error) {
        if (isNextCacheUnavailable(error)) return fn();
        throw error;
      }
    };
  } catch {
    return fn;
  }
}

function isNextCacheUnavailable(error: unknown): boolean {
  return error instanceof Error && error.message.includes("incrementalCache");
}
