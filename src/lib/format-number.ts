export function formatChineseNumber(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}千`;
  if (n < 100000000) {
    return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  }
  return `${(n / 100000000).toFixed(1).replace(/\.0$/, "")}亿`;
}

export function formatLocalizedNumber(n: number, locale: string): string {
  if (locale === "zh") return formatChineseNumber(n);
  if (n < 1000) return n.toString();
  if (n < 1000000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
}
