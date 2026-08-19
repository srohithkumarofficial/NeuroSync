import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Series {
  key: string;
  name: string;
  color: string;
}

export function TrendChart({
  data,
  series,
  height = 220,
  yLabel,
}: {
  data: Record<string, string | number>[];
  series: Series[];
  height?: number;
  yLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7A8699" }} axisLine={{ stroke: "#E2E5EA" }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#7A8699" }} axisLine={false} tickLine={false} label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "#7A8699" } : undefined} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#E2E5EA" }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3.5 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
