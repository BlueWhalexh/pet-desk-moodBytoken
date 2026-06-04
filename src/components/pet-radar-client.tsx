"use client";

import { useEffect, useState } from "react";

import { computeStatsFromSummary, type PetStats } from "@/lib/pet-stats";

import { PetRadar } from "@/components/pet-radar";

type PetRadarClientProps = {
  slug: string;
  importedAt: string;
  ariaLabel: string;
  labels: {
    vibrance: string;
    popularity: string;
    loved: string;
    freshness: string;
  };
};

type MetricsResponse = {
  installCount: number;
  likeCount: number;
  summary: { maxInstallCount: number; maxLikeCount: number };
};

const PLACEHOLDER_STATS: PetStats = {
  vibrance: 0,
  popularity: 0,
  loved: 0,
  freshness: 0,
};

export function PetRadarClient({
  slug,
  importedAt,
  ariaLabel,
  labels,
}: PetRadarClientProps) {
  const [stats, setStats] = useState<PetStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/pets/${slug}/metrics`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<MetricsResponse>) : null))
      .then((data) => {
        if (!data) return;
        setStats(
          computeStatsFromSummary(
            {
              importedAt,
              metrics: {
                installCount: data.installCount,
                likeCount: data.likeCount,
              },
            },
            data.summary,
          ),
        );
      })
      .catch(() => {
        /* keep placeholder */
      });
    return () => controller.abort();
  }, [slug, importedAt]);

  const display = stats ?? PLACEHOLDER_STATS;

  return (
    <PetRadar
      vibrance={display.vibrance}
      popularity={display.popularity}
      loved={display.loved}
      freshness={display.freshness}
      ariaLabel={ariaLabel}
      labels={labels}
    />
  );
}
