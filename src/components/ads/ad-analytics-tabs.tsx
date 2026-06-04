"use client";

import { useState } from "react";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { AdCampaignTimeSeries } from "@/lib/ads/queries";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type WindowKey = keyof AdCampaignTimeSeries;

const chartConfig = {
  impressions: { label: "Impressions", color: "var(--color-brand)" },
  hovers: { label: "Hovers", color: "#0ea5e9" },
  clicks: { label: "Clicks", color: "#f59e0b" },
} satisfies ChartConfig;

export function AdAnalyticsTabs({
  series,
  labels,
}: {
  series: AdCampaignTimeSeries;
  labels: Record<WindowKey, string>;
}) {
  const [active, setActive] = useState<WindowKey>("day");
  const data = series[active];

  return (
    <div className="mt-5 rounded-2xl border border-border-base bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-border-base bg-surface p-0.5">
          {(Object.keys(labels) as WindowKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.1em] uppercase transition md:px-3 ${
                active === key
                  ? "bg-inverse text-on-inverse"
                  : "text-muted-3 hover:text-foreground"
              }`}
            >
              {labels[key]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-3">
          <Legend color="bg-brand" label="Impressions" />
          <Legend color="bg-sky-500" label="Hovers" />
          <Legend color="bg-amber-500" label="Clicks" />
        </div>
      </div>

      <ChartContainer config={chartConfig} className="mt-4 h-[220px] w-full">
        <LineChart
          accessibilityLayer
          data={data}
          margin={{ left: 8, right: 8 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={formatTick}
          />
          <YAxis tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="impressions"
            stroke="var(--color-impressions)"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="hovers"
            stroke="var(--color-hovers)"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="clicks"
            stroke="var(--color-clicks)"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function formatTick(value: string): string {
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
  }).format(date);
}
