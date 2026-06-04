"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { VersionAdoptionRow } from "@/lib/telemetry/queries";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Props = {
  data: VersionAdoptionRow[];
  emptyLabel?: string;
};

const VERSION_COLORS = [
  "var(--brand)",
  "var(--chart-2, #6366f1)",
  "var(--chart-3, #f59e0b)",
  "var(--chart-4, #10b981)",
  "var(--chart-5, #ef4444)",
];

function buildChartData(rows: VersionAdoptionRow[]) {
  const versions = [...new Set(rows.map((r) => r.version))].sort();
  const byDay = new Map<string, Record<string, number>>();

  for (const row of rows) {
    const entry = byDay.get(row.day) ?? {};
    entry[row.version] = row.installs;
    byDay.set(row.day, entry);
  }

  return {
    versions,
    series: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, counts]) => ({
        label: day.slice(5),
        ...counts,
      })),
  };
}

export function AdminVersionAdoptionChart({
  data,
  emptyLabel = "No data yet.",
}: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-3">{emptyLabel}</p>;
  }

  const { versions, series } = buildChartData(data);

  const chartConfig = Object.fromEntries(
    versions.map((v, i) => [
      v,
      {
        label: v,
        color: VERSION_COLORS[i % VERSION_COLORS.length],
      },
    ]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <AreaChart data={series} margin={{ left: 0, right: 0, top: 4 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.2} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          interval={Math.max(0, Math.floor(series.length / 6) - 1)}
          className="text-[10px]"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={24}
          className="text-[10px]"
        />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        {versions.map((v, i) => (
          <Area
            key={v}
            type="monotone"
            dataKey={v}
            stackId="1"
            stroke={VERSION_COLORS[i % VERSION_COLORS.length]}
            fill={VERSION_COLORS[i % VERSION_COLORS.length]}
            fillOpacity={0.4}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
