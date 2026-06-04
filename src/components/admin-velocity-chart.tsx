"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { SubmissionVelocityPoint } from "@/lib/admin-insights";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Props = {
  data: SubmissionVelocityPoint[];
};

const chartConfig = {
  approved: { label: "Approved", color: "var(--chip-success-fg)" },
  pending: { label: "Pending", color: "var(--chip-warning-fg)" },
  rejected: { label: "Rejected", color: "var(--chip-danger-fg)" },
} satisfies ChartConfig;

export function AdminVelocityChart({ data }: Props) {
  const peak = data.reduce(
    (acc, point) =>
      Math.max(acc, point.approved + point.pending + point.rejected),
    0,
  );
  if (data.length === 0 || peak === 0) {
    return (
      <p className="text-sm text-muted-3">
        No submissions in the last 24 hours.
      </p>
    );
  }

  const series = data.map((point) => ({
    ...point,
    hour: new Date(point.bucket).toLocaleTimeString([], {
      hour: "numeric",
      hour12: false,
    }),
  }));

  return (
    <div className="space-y-3">
      <ChartContainer config={chartConfig} className="h-40 w-full">
        <BarChart
          accessibilityLayer
          data={series}
          margin={{ left: 0, right: 0, top: 4 }}
        >
          <CartesianGrid vertical={false} strokeOpacity={0.2} />
          <XAxis
            dataKey="hour"
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
          <Bar dataKey="approved" stackId="a" fill="var(--color-approved)" />
          <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" />
          <Bar dataKey="rejected" stackId="a" fill="var(--color-rejected)" />
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
      <p className="text-right font-mono text-[10px] tracking-[0.18em] text-muted-3 uppercase">
        Last 24h · peak {peak}/h
      </p>
    </div>
  );
}
