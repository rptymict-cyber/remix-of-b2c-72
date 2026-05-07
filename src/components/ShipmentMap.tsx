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
            <stop offset="0%" stopColor="#f5f3ee" />
            <stop offset="100%" stopColor="#ecebe4" />
          </linearGradient>
          <radialGradient id="farmGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* base — Kakao Map 느낌의 베이지 배경 */}
        <rect width={W} height={H} fill="url(#mapBg)" />

        {/* 공원/녹지 */}
        <path d="M 0 0 L 80 0 Q 70 40 100 70 Q 60 90 30 80 Z" fill="#dde8d4" />
        <path d="M 240 200 Q 280 180 320 200 L 340 230 L 340 280 L 220 280 Q 230 240 240 200 Z" fill="#dde8d4" />
        <circle cx="200" cy="55" r="22" fill="#dde8d4" />

        {/* 강/물 */}
        <path d="M -10 150 Q 80 130 150 165 Q 220 195 350 175 L 350 195 Q 220 215 150 185 Q 80 150 -10 170 Z" fill="#cfe3ee" />

        {/* 블록(건물 영역) — 옅은 회색 사각형 */}
        <g fill="#e8e4d8">
          <rect x="30" y="100" width="40" height="22" rx="2" />
          <rect x="78" y="100" width="28" height="22" rx="2" />
          <rect x="30" y="128" width="28" height="18" rx="2" />
          <rect x="66" y="128" width="40" height="18" rx="2" />
          <rect x="120" y="80" width="48" height="26" rx="2" />
          <rect x="120" y="112" width="22" height="34" rx="2" />
          <rect x="148" y="112" width="20" height="34" rx="2" />
          <rect x="180" y="90" width="34" height="20" rx="2" />
          <rect x="180" y="116" width="34" height="28" rx="2" />
          <rect x="225" y="100" width="40" height="44" rx="2" />
          <rect x="270" y="100" width="40" height="22" rx="2" />
          <rect x="270" y="128" width="40" height="16" rx="2" />
          <rect x="40" y="220" width="50" height="22" rx="2" />
          <rect x="100" y="220" width="34" height="22" rx="2" />
          <rect x="142" y="220" width="40" height="30" rx="2" />
          <rect x="190" y="225" width="28" height="25" rx="2" />
        </g>

        {/* 도로 — 흰색 메인 + 얇은 보조 */}
        <g stroke="#ffffff" strokeLinecap="round" fill="none">
          {/* 주요 도로 (굵은 흰색) */}
          <path d="M 0 110 L 340 110" strokeWidth="6" />
          <path d="M 0 218 L 340 218" strokeWidth="5" />
          <path d="M 110 0 L 110 280" strokeWidth="5" />
          <path d="M 218 0 L 218 280" strokeWidth="5" />
          {/* 곡선 도로 */}
          <path d="M 0 60 Q 120 70 220 50 T 340 70" strokeWidth="3" />
          <path d="M 0 250 Q 120 240 220 260 T 340 245" strokeWidth="3" />
          {/* 보조 격자 */}
          <path d="M 60 0 L 60 280" strokeWidth="1.5" opacity="0.85" />
          <path d="M 160 0 L 160 280" strokeWidth="1.5" opacity="0.85" />
          <path d="M 270 0 L 270 280" strokeWidth="1.5" opacity="0.85" />
          <path d="M 0 150 L 340 150" strokeWidth="1.5" opacity="0.85" />
          <path d="M 0 185 L 340 185" strokeWidth="1.5" opacity="0.85" />
        </g>

        {/* 고속도로 노란선 */}
        <path d="M 0 110 L 340 110" stroke="#f6c66a" strokeWidth="1.2" opacity="0.9" />
        <path d="M 218 0 L 218 280" stroke="#f6c66a" strokeWidth="1.2" opacity="0.9" />

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
