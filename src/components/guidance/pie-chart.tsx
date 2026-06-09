const COLORS = ["#093657", "#1a7db5", "#4db8e8", "#82caf0", "#b8def7", "#d4edfb", "#e8f4fd", "#f0f8ff"];

type PieChartProps = {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  showLegend?: boolean;
};

export function PieChart({ data, size = 160, showLegend = true }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">Veri yok</p>;

  const slices = data.reduce<{ path: string; color: string; label: string; value: number }[]>((acc, d, i) => {
    const sumBefore = acc.reduce((s, a) => s + a.value, 0);
    const startAngle = (sumBefore / total) * 360;
    const endAngle = ((sumBefore + d.value) / total) * 360;
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const r = size / 2 - 8;

    const x1 = size / 2 + r * Math.cos(startRad);
    const y1 = size / 2 + r * Math.sin(startRad);
    const x2 = size / 2 + r * Math.cos(endRad);
    const y2 = size / 2 + r * Math.sin(endRad);

    const path = d.value === total
      ? `M ${size / 2},${size / 2 - 8} A ${r},${r} 0 1,1 ${size / 2 - 0.01},${size / 2 - 8} Z`
      : `M ${size / 2},${size / 2} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

    acc.push({ path, color: d.color ?? COLORS[i % COLORS.length], label: d.label, value: d.value });
    return acc;
  }, []);

  return (
    <div className={`flex ${showLegend ? "flex-wrap items-center gap-4" : "items-center justify-center"}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={1} />
        ))}
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="text-sm font-semibold" fill="#093657">
          {total}
        </text>
      </svg>
      {showLegend && (
        <div className="space-y-1 text-sm">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
              <span>{s.label}</span>
              <span className="font-medium">{(s.value / total) * 100 === 0 ? 0 : ((s.value / total) * 100).toFixed(0)}%</span>
              <span className="text-muted-foreground">({s.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
