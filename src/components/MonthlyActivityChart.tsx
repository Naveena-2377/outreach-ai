"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export type MonthlyPoint = {
  month: string;
  emails: number;
  leads: number;
  meetings: number;
};

function ActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: MonthlyPoint }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border-strong bg-bg-card-hover px-4 py-3 text-sm shadow-xl">
      <div className="mb-2 font-medium text-text-primary">{label}</div>
      <div className="text-accent-pink">emails : {d.emails}</div>
      <div className="text-accent-cyan">leads : {d.leads}</div>
      <div className="text-accent-green">meetings : {d.meetings}</div>
    </div>
  );
}

export function MonthlyActivityChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <div className="font-mono-label mb-6 text-[10px] text-text-secondary">
        MONTHLY ACTIVITY
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1d222e" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#4c5566"
            tick={{ fill: "#7c8494", fontSize: 12 }}
            axisLine={{ stroke: "#1d222e" }}
            tickLine={false}
          />
          <YAxis
            stroke="#4c5566"
            tick={{ fill: "#7c8494", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ActivityTooltip />} cursor={{ stroke: "#262c3a" }} />
          <Line
            type="monotone"
            dataKey="emails"
            stroke="#ef4d84"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ef4d84", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
