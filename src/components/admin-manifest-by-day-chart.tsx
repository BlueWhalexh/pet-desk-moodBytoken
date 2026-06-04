"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ByDayPoint = {
  day: string;
  count: number;
  slim: number;
  full: number;
};

const chartConfig = {
  slim: { label: "Slim", color: "var(--brand)" },
  full: { label: "Full", color: "var(--brand-deep)" },
} satisfies ChartConfig;

export function AdminManifestByDayChart({ data }: { data: ByDayPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-3">No fetches in this window.</p>;
  }

  const series = [...data].reverse().map((d) => ({
    ...d,
    label: d.day.slice(5),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart
        accessibilityLayer
        data={series}
        margin={{ left: 0, right: 0, top: 4 }}
      >
        <CartesianGrid vertical={false} strokeOpacity={0.2} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          interval={Math.max(0, Math.floor(series.length / 7) - 1)}
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
        <Bar dataKey="slim" stackId="a" fill="var(--color-slim)" />
        <Bar dataKey="full" stackId="a" fill="var(--color-full)" />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
}
