import { useMemo } from "react";

export interface MapMarket {
  id: string;
  name: string;
  distanceKm: number;
  lat: number;
  lng: number;
  netRevenue?: number;
  unitPrice?: number;
  logistics?: number;
}

interface Props {
  farm: { name: string; region: string; lat: number; lng: number };
  markets: MapMarket[];
  recommendedId: string;
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

// Bounding box covering South Korea for projection
const BBOX = { minLat: 33.8, maxLat: 38.7, minLng: 125.6, maxLng: 130.0 };
const VIEW_W = 320;
const VIEW_H = 420;

const project = (lat: number, lng: number) => {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * VIEW_W;
  const y = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * VIEW_H;
  return { xPct: (x / VIEW_W) * 100, yPct: (y / VIEW_H) * 100 };
};

type BubbleDir = "top" | "bottom" | "left" | "right";

const computeDirections = (
  farm: { lat: number; lng: number },
  markets: MapMarket[],
): Record<string, BubbleDir> => {
  const all = [farm, ...markets];
  const cLat = all.reduce((s, p) => s + p.lat, 0) / all.length;
  const cLng = all.reduce((s, p) => s + p.lng, 0) / all.length;
  const result: Record<string, BubbleDir> = {};
  markets.forEach((m) => {
    const dLat = m.lat - cLat;
    const dLng = m.lng - cLng;
    if (Math.abs(dLng) > Math.abs(dLat) * 1.2) {
      result[m.id] = dLng > 0 ? "left" : "right";
    } else {
      result[m.id] = dLat > 0 ? "top" : "bottom";
    }
  });
  return result;
};

// Stylized illustrated South Korea peninsula (simplified, decorative only)
const PeninsulaSVG = () => (
  <svg
    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
    preserveAspectRatio="xMidYMid meet"
    className="absolute inset-0 w-full h-full"
  >
    <defs>
      <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EAF4FB" />
        <stop offset="100%" stopColor="#DCEAF5" />
      </linearGradient>
      <linearGradient id="landG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E9F2DC" />
        <stop offset="60%" stopColor="#DDEAC7" />
        <stop offset="100%" stopColor="#CFE0B5" />
      </linearGradient>
      <radialGradient id="haloG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Sea background */}
    <rect width={VIEW_W} height={VIEW_H} fill="url(#seaG)" />

    {/* Subtle sea texture dots */}
    {Array.from({ length: 24 }).map((_, i) => {
      const x = (i * 53) % VIEW_W;
      const y = (i * 97) % VIEW_H;
      return <circle key={i} cx={x} cy={y} r={1} fill="#C9DCEB" opacity={0.5} />;
    })}

    {/* Stylized peninsula land (decorative, not geographic) */}
    <path
      d="M150 18
         C 180 14, 215 22, 228 50
         C 240 78, 232 102, 238 128
         C 246 160, 270 175, 278 205
         C 284 232, 268 252, 258 274
         C 250 296, 256 318, 240 340
         C 222 364, 198 376, 178 388
         C 158 400, 140 410, 124 402
         C 108 394, 100 372, 96 350
         C 90 322, 100 298, 92 274
         C 82 246, 60 232, 56 200
         C 52 168, 70 148, 80 124
         C 88 100, 78 78, 96 56
         C 112 36, 130 22, 150 18 Z"
      fill="url(#landG)"
      stroke="#B8CFA1"
      strokeWidth="1.2"
    />

    {/* Soft mountain hints */}
    <g fill="#C7DAB0" opacity="0.55">
      <ellipse cx="170" cy="120" rx="22" ry="6" />
      <ellipse cx="200" cy="160" rx="18" ry="5" />
      <ellipse cx="150" cy="200" rx="26" ry="6" />
      <ellipse cx="220" cy="240" rx="20" ry="5" />
      <ellipse cx="170" cy="290" rx="24" ry="6" />
      <ellipse cx="140" cy="340" rx="18" ry="5" />
    </g>

    {/* Jeju island hint */}
    <ellipse cx="150" cy="412" rx="14" ry="6" fill="url(#landG)" stroke="#B8CFA1" strokeWidth="1" />
  </svg>
);

const FarmMarker = ({ region, xPct, yPct }: { region: string; xPct: number; yPct: number }) => (
  <div
    className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
    style={{ left: `${xPct}%`, top: `${yPct}%` }}
  >
    <div className="flex flex-col items-center">
      <div
        className="w-9 h-9 rounded-full bg-primary border-[3px] border-white flex items-center justify-center text-white shadow-md"
        style={{ boxShadow: "0 3px 8px rgba(0,0,0,0.2)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div className="mt-1 bg-neutral-900 text-white text-[10px] font-bold px-2 py-[3px] rounded-md whitespace-nowrap shadow">
        내 농장 <span className="font-medium opacity-80 ml-0.5">{region}</span>
      </div>
    </div>
  </div>
);

const MarketBubble = ({
  m,
  rank,
  recommended,
  selected,
  dir,
  onClick,
}: {
  m: MapMarket;
  rank: number;
  recommended: boolean;
  selected: boolean;
  dir: BubbleDir;
  onClick: () => void;
}) => {
  const { xPct, yPct } = project(m.lat, m.lng);

  // Wrapper layout per direction (anchor point = the marker pin tip on coord)
  const wrapperPosStyle: React.CSSProperties = { left: `${xPct}%`, top: `${yPct}%` };
  let wrapperClass = "absolute z-10";
  let innerClass = "flex items-center";
  if (dir === "top") {
    wrapperClass += " -translate-x-1/2 -translate-y-full";
    innerClass = "flex flex-col items-center";
  } else if (dir === "bottom") {
    wrapperClass += " -translate-x-1/2";
    innerClass = "flex flex-col-reverse items-center";
  } else if (dir === "left") {
    wrapperClass += " -translate-x-full -translate-y-1/2";
    innerClass = "flex flex-row-reverse items-center gap-1";
  } else {
    wrapperClass += " -translate-y-1/2";
    innerClass = "flex flex-row items-center gap-1";
  }

  const scale = selected ? "scale-[1.06]" : "scale-100";

  const Pin = (
    <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow">
      <path
        d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"
        fill="hsl(var(--primary))"
        stroke="#fff"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9" r="2.5" fill="#fff" />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${wrapperClass} transition-transform duration-150 ${scale}`}
      style={wrapperPosStyle}
      aria-label={`${rank}위 ${m.name} ${m.distanceKm}km`}
    >
      <div className={innerClass}>
        {recommended ? (
          <div
            className={`relative bg-white rounded-2xl px-3 pt-4 pb-2 whitespace-nowrap border ${
              selected ? "border-primary border-2" : "border-primary"
            }`}
            style={{
              boxShadow: selected
                ? "0 0 0 4px hsl(var(--primary) / 0.15), 0 8px 18px rgba(0,0,0,0.12)"
                : "0 6px 16px rgba(0,0,0,0.10)",
            }}
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-extrabold px-2 py-[2px] rounded-full tracking-wide">
              추천 시장
            </span>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-foreground">
              <span className="text-amber-500">★</span>
              <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-[1px] rounded">
                {rank}위
              </span>
              <span>{m.name}</span>
              <span className="text-muted-foreground font-bold">{m.distanceKm}km</span>
            </div>
          </div>
        ) : (
          <div
            className={`bg-white rounded-xl px-2 py-1 whitespace-nowrap border text-[10px] font-bold text-foreground ${
              selected ? "border-primary border-2" : "border-border"
            }`}
            style={{
              boxShadow: selected
                ? "0 0 0 3px hsl(var(--primary) / 0.12), 0 4px 10px rgba(0,0,0,0.10)"
                : "0 3px 8px rgba(0,0,0,0.08)",
            }}
          >
            <span className="bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-[1px] rounded mr-1">
              {rank}위
            </span>
            {m.name}
            <span className="text-muted-foreground ml-1">{m.distanceKm}km</span>
          </div>
        )}
        {Pin}
      </div>
    </button>
  );
};

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, disabled = false, onSelect }: Props) => {
  const directions = useMemo(() => computeDirections(farm, markets), [farm, markets]);
  const farmPos = project(farm.lat, farm.lng);

  // Order markets by distance to assign rank (1,2,3) — preserves existing ranking
  const ranked = [...markets].sort((a, b) => a.distanceKm - b.distanceKm);
  const rankMap: Record<string, number> = {};
  ranked.forEach((m, i) => (rankMap[m.id] = i + 1));

  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-border shadow-[0_4px_16px_rgba(17,24,39,0.06)] bg-white"
      style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}`, maxHeight: 460 }}
      data-map-disabled={disabled}
    >
      <PeninsulaSVG />

      {/* Markers layer */}
      <div className="absolute inset-0">
        <FarmMarker region={farm.region} xPct={farmPos.xPct} yPct={farmPos.yPct} />
        {markets.map((m) => (
          <MarketBubble
            key={m.id}
            m={m}
            rank={rankMap[m.id]}
            recommended={m.id === recommendedId}
            selected={m.id === selectedId}
            dir={directions[m.id] ?? "top"}
            onClick={() => !disabled && onSelect(m.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ShipmentMap;
