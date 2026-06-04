"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { InstallsByDayRow } from "@/lib/telemetry/queries";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Props = {
  data: InstallsByDayRow[];
  emptyLabel?: string;
};

const chartConfig = {
  count: { label: "Installs", color: "var(--brand)" },
} satisfies ChartConfig;

export function AdminAdoptionChart({
  data,
  emptyLabel = "No data yet.",
}: Props) {
  const peak = data.reduce((acc, row) => Math.max(acc, row.count), 0);
  if (data.length === 0 || peak === 0) {
    return <p className="text-sm text-muted-3">{emptyLabel}</p>;
  }

  const series = data.map((row) => ({
    ...row,
    label: row.date.slice(5),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
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
        <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
