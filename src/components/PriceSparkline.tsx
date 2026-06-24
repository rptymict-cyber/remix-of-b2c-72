interface Props {
  data: number[];
  width?: number;
  height?: number;
  showMarker?: boolean;
  className?: string;
}

const PriceSparkline = ({ data, width = 320, height = 80, showMarker = true, className = "" }: Props) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 6;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * step;
    const y = pad + h - ((v - min) / range) * h;
    return { x, y, v };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${pad + h} L ${pad} ${pad + h} Z`;

  const first = data[0];
  const last = data[data.length - 1];
  const trend = last > first ? "up" : last < first ? "down" : "flat";
  const stroke =
    trend === "up" ? "hsl(0 72% 50%)" : trend === "down" ? "hsl(215 80% 55%)" : "hsl(215 10% 55%)";
  const fillId = `spark-fill-${trend}`;

  const lastPt = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {showMarker && (
        <>
          <circle cx={lastPt.x} cy={lastPt.y} r={5} fill="#fff" stroke={stroke} strokeWidth={2.5} />
        </>
      )}
    </svg>
  );
};

export default PriceSparkline;
