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
  onSelect: (id: string) => void;
}

// 위경도 → 카드 내 % 좌표 (한반도 남부 대략 bbox)
const LAT_MAX = 38.7; // 위쪽
const LAT_MIN = 33.0; // 아래쪽
const LNG_MIN = 125.5;
const LNG_MAX = 130.2;
const project = (lat: number, lng: number) => ({
  left: ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100,
  top: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100,
});

const shortName = (n: string) => n.replace("시장", "").replace("서울 ", "").trim();

// 단순화된 남한 실루엣 (viewBox 0 0 100 120 기준, 위 bbox와 정렬)
// 형태: 서해안→남해안→동해안 순으로 부드럽게 폐곡선
const KOREA_PATH =
  "M28,8 C36,4 44,6 50,10 C58,14 60,20 62,24 C66,26 72,28 74,32 C78,38 80,46 78,52 C76,58 74,64 70,70 C66,78 62,86 56,92 C50,98 44,102 38,100 C32,98 28,92 26,86 C22,78 20,70 22,62 C20,54 16,46 18,38 C20,30 22,22 24,16 C25,12 26,10 28,8 Z";

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, onSelect }: Props) => {
  const farmPos = useMemo(() => project(farm.lat, farm.lng), [farm.lat, farm.lng]);
  const points = useMemo(
    () => markets.map((m) => ({ ...m, ...project(m.lat, m.lng) })),
    [markets],
  );

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border"
      style={{
        height: 280,
        background:
          "linear-gradient(180deg, hsl(200 60% 96%) 0%, hsl(200 50% 92%) 100%)",
        zIndex: 1,
      }}
    >
      {/* 한반도 실루엣 + 연결선 + 마커 모두 동일 SVG 안에서 그려 레이어 충돌 방지 */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
      >
        {/* 바다 grid 패턴 (옅은 격자) */}
        <defs>
          <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M6 0 L0 0 0 6" fill="none" stroke="hsl(200 40% 88%)" strokeWidth="0.2" />
          </pattern>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142 45% 88%)" />
            <stop offset="100%" stopColor="hsl(142 40% 78%)" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* 남한 실루엣 (ViewBox는 0~100 가로, 0~120 세로 — bbox 비율과 맞춤) */}
        <g transform="translate(0,-2) scale(1, 0.88)">
          <path
            d={KOREA_PATH}
            fill="url(#land)"
            stroke="hsl(142 35% 60%)"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        </g>

        {/* 농장 → 시장 연결선 */}
        {points.map((p) => {
          const isRec = p.id === recommendedId;
          return (
            <line
              key={`l-${p.id}`}
              x1={farmPos.left}
              y1={farmPos.top}
              x2={p.left}
              y2={p.top}
              stroke={isRec ? "hsl(142 71% 35%)" : "hsl(220 10% 60%)"}
              strokeWidth={isRec ? "0.7" : "0.4"}
              strokeDasharray={isRec ? undefined : "1.2 1.4"}
              opacity={isRec ? 0.9 : 0.5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* 시장 마커 (HTML — 클릭 가능) */}
      {points.map((p) => {
        const isRec = p.id === recommendedId;
        const isSel = p.id === selectedId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center"
            style={{ left: `${p.left}%`, top: `${p.top}%`, zIndex: 2 }}
          >
            <div
              className={`flex items-center justify-center rounded-full border-2 border-white shadow-md transition-transform ${
                isRec ? "w-9 h-9" : "w-7 h-7"
              } ${isSel ? "scale-110" : ""}`}
              style={{
                background: isRec ? "hsl(142 71% 35%)" : "#ffffff",
                color: isRec ? "#fff" : "hsl(220 15% 35%)",
                borderColor: isRec ? "#fff" : isSel ? "hsl(142 71% 35%)" : "#fff",
              }}
            >
              {isRec ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15 9 22 9 17 14 19 22 12 18 5 22 7 14 2 9 9 9" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              )}
            </div>
            <div
              className={`mt-1 px-1.5 py-0.5 rounded-full bg-white whitespace-nowrap shadow-sm ${
                isRec ? "border border-primary/40" : "border border-border"
              }`}
              style={{ fontSize: 10, fontWeight: 600, color: isRec ? "hsl(142 71% 35%)" : "#374151" }}
            >
              {shortName(p.name)}
              <span className="ml-1 font-normal text-muted-foreground">{p.distanceKm}km</span>
            </div>
          </button>
        );
      })}

      {/* 농장 마커 */}
      <div
        className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none"
        style={{ left: `${farmPos.left}%`, top: `${farmPos.top}%`, zIndex: 3 }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white shadow-lg"
          style={{ background: "hsl(142 71% 35%)", color: "#fff" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H10v7H5a2 2 0 0 1-2-2z" />
          </svg>
        </div>
        <div
          className="mt-1 px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm"
          style={{ fontSize: 10, fontWeight: 700, background: "#111827", color: "#fff" }}
        >
          내 농장
          <span className="ml-1 font-normal opacity-80">{farm.region}</span>
        </div>
      </div>

      {/* 범례 */}
      <div className="absolute left-3 top-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-[10px] text-muted-foreground border border-border" style={{ zIndex: 2 }}>
        대한민국 출하 위치도
      </div>
    </div>
  );
};

export default ShipmentMap;
