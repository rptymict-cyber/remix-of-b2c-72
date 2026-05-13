import { useMemo } from "react";
import koreaMap from "@/assets/korea-map.jpg";

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

// Calibrated to korea-map.jpg (1024x1024 illustrated peninsula).
// South Korea sits in this region of the image (in % of width/height):
const CAL = {
  // lat range
  topLat: 38.6, topYPct: 36,    // DMZ line in image
  botLat: 33.3, botYPct: 88,    // Jeju in image
  // lng range
  westLng: 125.5, westXPct: 26,
  eastLng: 130.0, eastXPct: 72,
};

const project = (lat: number, lng: number) => {
  const yPct =
    CAL.topYPct +
    ((CAL.topLat - lat) / (CAL.topLat - CAL.botLat)) * (CAL.botYPct - CAL.topYPct);
  const xPct =
    CAL.westXPct +
    ((lng - CAL.westLng) / (CAL.eastLng - CAL.westLng)) * (CAL.eastXPct - CAL.westXPct);
  return { xPct, yPct };
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

// Illustrated Korean peninsula background (image asset)
const PeninsulaBg = () => (
  <img
    src={koreaMap}
    alt="한반도 지도"
    loading="lazy"
    width={1024}
    height={1024}
    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
    draggable={false}
  />
);

const FarmMarker = ({ region, xPct, yPct }: { region: string; xPct: number; yPct: number }) => (
  <div
    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
    style={{ left: `${xPct}%`, top: `${yPct}%` }}
  >
    <div className="flex flex-col items-center">
      <div
        className="w-10 h-10 rounded-full bg-primary border-[3px] border-white flex items-center justify-center text-white"
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div className="mt-1.5 bg-neutral-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg">
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
