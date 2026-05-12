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
        background: "hsl(208 65% 88%)",
        zIndex: 1,
      }}
    >
      {/* 한반도 실루엣 + 연결선 + 마커 모두 동일 SVG 안에서 그려 레이어 충돌 방지 */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
      >
        {/* === Google Maps 스타일 배경 === */}
        {/* 바다 */}
        <rect width="100" height="100" fill="hsl(208 60% 86%)" />

        {/* 남한 본토 (크림색 land) */}
        <path
          d="M 30 1 C 24 5 22 11 26 15 C 22 20 27 25 22 30 C 26 36 21 42 25 48 C 19 54 23 60 26 66 C 30 72 36 78 44 80 C 52 82 60 80 66 76 C 72 72 78 64 76 56 C 80 48 78 40 80 32 C 78 24 80 14 74 8 C 66 3 58 0 50 1 Z"
          fill="hsl(45 35% 94%)"
          stroke="hsl(40 25% 80%)"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
        {/* 제주도 */}
        <ellipse cx="22" cy="92" rx="4" ry="2" fill="hsl(45 35% 94%)" stroke="hsl(40 25% 80%)" strokeWidth="0.3" />

        {/* 녹지 (산악 지대) */}
        <path d="M 60 18 C 64 22 68 28 66 36 C 70 42 68 50 64 56 C 62 50 58 44 60 38 C 56 30 58 22 60 18 Z" fill="hsl(95 35% 86%)" opacity="0.7" />
        <path d="M 32 60 C 36 64 38 70 36 74 C 32 72 30 66 32 60 Z" fill="hsl(95 35% 86%)" opacity="0.7" />

        {/* 도로망 (얇은 흰선 + 노란 강조) */}
        <g stroke="white" strokeWidth="0.8" fill="none" strokeLinecap="round">
          <path d="M 32 18 L 38 30 L 40 42 L 50 50 L 66 50 L 76 62" />
          <path d="M 40 42 L 30 56 L 28 64" />
          <path d="M 38 30 L 50 28 L 60 22" />
          <path d="M 50 50 L 56 60 L 60 70" />
        </g>
        <g stroke="hsl(45 90% 70%)" strokeWidth="0.45" fill="none" strokeLinecap="round">
          <path d="M 32 18 L 38 30 L 40 42 L 50 50 L 66 50 L 76 62" />
          <path d="M 38 30 L 50 28 L 60 22" />
        </g>

        {/* 지역명 (옅은 회색, 굵게) */}
        <g fill="hsl(220 10% 45%)" fontFamily="'Noto Sans KR', sans-serif" fontWeight="700" textAnchor="middle">
          <text x="35" y="36" fontSize="2.6" opacity="0.85">충청남도</text>
          <text x="58" y="32" fontSize="2.6" opacity="0.85" fill="hsl(0 60% 55%)">충청북도</text>
          <text x="68" y="48" fontSize="2.6" opacity="0.85">경상북도</text>
          <text x="34" y="64" fontSize="2.4" opacity="0.85">전라남도</text>
          <text x="62" y="20" fontSize="2.4" opacity="0.8">강원도</text>
        </g>
        {/* 도시명 (작은 글씨) */}
        <g fill="hsl(220 12% 30%)" fontFamily="'Noto Sans KR', sans-serif" fontWeight="600" textAnchor="middle">
          <text x="33" y="20" fontSize="1.8">서울</text>
          <text x="44" y="26" fontSize="1.6">천안</text>
          <text x="50" y="30" fontSize="1.6">진천</text>
          <text x="54" y="36" fontSize="1.6">청주</text>
          <text x="50" y="42" fontSize="1.6">세종</text>
          <text x="52" y="46" fontSize="1.6">대전</text>
          <text x="38" y="48" fontSize="1.6">논산</text>
          <text x="32" y="44" fontSize="1.6">부여</text>
          <text x="29" y="50" fontSize="1.6">보령</text>
          <text x="38" y="34" fontSize="1.6">아산</text>
          <text x="33" y="28" fontSize="1.6">당진</text>
          <text x="69" y="52" fontSize="1.7">대구</text>
          <text x="76" y="64" fontSize="1.7">부산</text>
          <text x="32" y="62" fontSize="1.7">광주</text>
        </g>

        {/* 고속도로 방패 마크 */}
        <g>
          <rect x="46" y="32" width="4" height="3.4" rx="0.6" fill="hsl(45 95% 60%)" stroke="white" strokeWidth="0.4" />
          <text x="48" y="34.6" fontSize="2.2" fontWeight="800" fill="hsl(220 30% 25%)" textAnchor="middle" fontFamily="'Noto Sans KR', sans-serif">25</text>
          <rect x="27" y="56" width="5" height="3.4" rx="0.6" fill="hsl(45 95% 60%)" stroke="white" strokeWidth="0.4" />
          <text x="29.5" y="58.6" fontSize="2.2" fontWeight="800" fill="hsl(220 30% 25%)" textAnchor="middle" fontFamily="'Noto Sans KR', sans-serif">151</text>
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
