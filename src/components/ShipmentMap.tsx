import { useMemo } from "react";
import { MapPin, Star, Home } from "lucide-react";

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
  onSelect: (id: string) => void;
}

const W = 340;
const H = 280;
const LAT_MAX = 38.2;
const LAT_MIN = 34.6;
const LON_MIN = 125.6;
const LON_MAX = 129.6;

const project = (lat: number, lng: number) => ({
  x: ((lng - LON_MIN) / (LON_MAX - LON_MIN)) * W,
  y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H,
});

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, onSelect }: Props) => {
  const farmPt = useMemo(() => project(farm.lat, farm.lng), [farm.lat, farm.lng]);
  const points = useMemo(
    () => markets.map((m) => ({ ...m, ...project(m.lat, m.lng) })),
    [markets]
  );

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef4ee" />
            <stop offset="100%" stopColor="#e5ecea" />
          </linearGradient>
          <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0 L0 0 0 22" fill="none" stroke="#dbe3df" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="farmGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* base */}
        <rect width={W} height={H} fill="url(#mapBg)" />
        <rect width={W} height={H} fill="url(#grid)" />

        {/* faux land blobs */}
        <path d="M 40 60 Q 120 40 200 70 T 320 90 L 320 220 Q 240 240 160 220 T 30 200 Z" fill="#e8efe8" opacity="0.7" />
        <path d="M 60 130 Q 150 110 230 140 T 320 160" fill="none" stroke="#d4ddd6" strokeWidth="1.2" />

        {/* faux highways */}
        <path d="M 80 40 Q 140 120 200 200 T 310 260" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.9" />
        <path d="M 80 40 Q 140 120 200 200 T 310 260" fill="none" stroke="#fbbf24" strokeWidth="0.8" opacity="0.7" />
        <path d="M 20 180 Q 120 160 220 170 T 330 150" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" />
        <path d="M 160 20 Q 170 120 180 220 T 200 280" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.7" />

        {/* connection lines from farm */}
        {points.map((p) => {
          const isRec = p.id === recommendedId;
          const isSel = p.id === selectedId;
          return (
            <line
              key={`l-${p.id}`}
              x1={farmPt.x}
              y1={farmPt.y}
              x2={p.x}
              y2={p.y}
              stroke={isRec ? "hsl(var(--primary))" : "#9ca3af"}
              strokeOpacity={isRec || isSel ? 0.7 : 0.25}
              strokeWidth={isRec ? 1.6 : 1}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* farm glow */}
        <circle cx={farmPt.x} cy={farmPt.y} r="34" fill="url(#farmGlow)" />
      </svg>

      {/* HTML markers overlay */}
      <div className="absolute inset-0">
        {points.map((p) => {
          const isRec = p.id === recommendedId;
          const isSel = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ring-2 ring-white transition-transform ${
                  isRec
                    ? "bg-primary text-white scale-110"
                    : isSel
                    ? "bg-foreground text-white scale-105"
                    : "bg-white text-muted-foreground"
                }`}
              >
                {isRec ? <Star className="w-4 h-4 fill-white" /> : <MapPin className="w-4 h-4" />}
              </div>
              <div
                className={`mt-1 px-2 py-0.5 rounded-full bg-white shadow-sm text-[10px] font-semibold whitespace-nowrap ${
                  isRec ? "text-primary border border-primary/30" : "text-foreground border border-border"
                }`}
              >
                {p.name.replace("시장", "").replace("서울 ", "").trim()}
                <span className="ml-1 text-muted-foreground font-normal">{p.distanceKm}km</span>
              </div>
            </button>
          );
        })}

        {/* farm marker */}
        <div
          style={{ left: `${(farmPt.x / W) * 100}%`, top: `${(farmPt.y / H) * 100}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
        >
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg ring-4 ring-white">
            <Home className="w-4 h-4" />
          </div>
          <div className="mt-1 px-2.5 py-1 rounded-full bg-foreground text-white shadow-md text-[10px] font-bold whitespace-nowrap">
            내 농장
            <span className="ml-1 font-normal opacity-80">{farm.region}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentMap;
