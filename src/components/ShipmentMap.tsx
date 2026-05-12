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
  onSelect: (id: string) => void;
}

// === 정적 지도 이미지 위 절대 좌표 (% 단위) ===
// 지도 이미지는 src/assets/korea-map.jpg, viewport 비율에 맞춰 하드코딩
const MARKET_POS: Record<string, { left: number; top: number }> = {
  garak:    { left: 44,   top: 21 },  // 서울 가락
  gangseo:  { left: 40,   top: 21 },
  suwon:    { left: 42,   top: 27 },
  anyang:   { left: 41,   top: 24 },
  cheongju: { left: 47,   top: 37 },
  daegu:    { left: 63,   top: 53 },
  busan:    { left: 76,   top: 67 },
  gwangju:  { left: 39,   top: 64 },
};
const FARM_POS = { left: 39, top: 45 }; // 충청남도 공주

const shortName = (n: string) => n.replace("시장", "").replace("서울 ", "").trim();

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, onSelect }: Props) => {
  const points = useMemo(
    () =>
      markets.map((m) => ({
        ...m,
        ...(MARKET_POS[m.id] ?? { left: 50, top: 50 }),
      })),
    [markets],
  );

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border"
      style={{ height: 280, zIndex: 1 }}
    >
      {/* 정적 지도 이미지 — 드래그/줌 없음, API 호출 없음 */}
      <img
        src={koreaMap}
        alt="대한민국 출하 위치도"
        loading="lazy"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {/* 농장 → 시장 연결선 (이미지 위 SVG 오버레이) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
      >
        {points.map((p) => {
          const isRec = p.id === recommendedId;
          return (
            <line
              key={`l-${p.id}`}
              x1={FARM_POS.left}
              y1={FARM_POS.top}
              x2={p.left}
              y2={p.top}
              stroke={isRec ? "hsl(142 71% 35%)" : "hsl(220 10% 35%)"}
              strokeWidth={isRec ? "0.5" : "0.3"}
              strokeDasharray={isRec ? undefined : "1.2 1.4"}
              opacity={isRec ? 0.85 : 0.45}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
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
            style={{ left: `${p.left}%`, top: `${p.top}%`, zIndex: 3 }}
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
        style={{ left: `${FARM_POS.left}%`, top: `${FARM_POS.top}%`, zIndex: 4 }}
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
    </div>
  );
};

export default ShipmentMap;
