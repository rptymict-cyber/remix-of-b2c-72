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
const MARKET_POS: Record<string, { left: number; top: number }> = {
  garak:    { left: 50, top: 30 },
  gangseo:  { left: 47, top: 30 },
  suwon:    { left: 47, top: 35 },
  anyang:   { left: 47, top: 33 },
  cheongju: { left: 53, top: 46 },
  daegu:    { left: 66, top: 57 },
  busan:    { left: 73, top: 67 },
  gwangju:  { left: 45, top: 68 },
};
const FARM_POS = { left: 49, top: 51 }; // 충청남도 공주

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
      className="relative rounded-3xl overflow-hidden border border-border bg-white shadow-[0_4px_16px_rgba(17,24,39,0.06)]"
      style={{ height: 320, zIndex: 1 }}
    >
      {/* 정적 지도 이미지 — 드래그/줌 없음, API 호출 없음 */}
      <img
        src={koreaMap}
        alt="대한민국 출하 위치도"
        loading="lazy"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {/* 농장 → 시장 연결선 */}
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
              stroke={isRec ? "hsl(142 60% 38%)" : "hsl(220 10% 45%)"}
              strokeWidth={isRec ? "0.45" : "0.28"}
              strokeDasharray={isRec ? "1.4 1" : "1 1.4"}
              opacity={isRec ? 0.7 : 0.35}
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
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group"
            style={{ left: `${p.left}%`, top: `${p.top}%`, zIndex: 3 }}
          >
            {isRec && (
              <div
                className="mb-1 px-2 py-0.5 rounded-full text-white whitespace-nowrap shadow-sm"
                style={{ fontSize: 9, fontWeight: 700, background: "hsl(142 60% 38%)" }}
              >
                추천 시장
              </div>
            )}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-white whitespace-nowrap transition-all ${
                isRec
                  ? "border-2 border-[hsl(142_60%_38%)] shadow-[0_4px_12px_rgba(34,139,76,0.25)]"
                  : `border ${isSel ? "border-[hsl(142_60%_38%)]" : "border-border"} shadow-sm`
              }`}
              style={{ fontSize: 11, fontWeight: 700 }}
            >
              {isRec && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="hsl(45 95% 55%)" stroke="hsl(45 95% 45%)" strokeWidth="1">
                  <polygon points="12 2 15 9 22 9 17 14 19 22 12 18 5 22 7 14 2 9 9 9" />
                </svg>
              )}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="hsl(142 60% 38%)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ color: "#1f2937" }}>{shortName(p.name)}</span>
              <span style={{ color: "#9ca3af", fontWeight: 500 }}>{p.distanceKm}km</span>
            </div>
          </button>
        );
      })}

      {/* 농장 마커 */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
        style={{ left: `${FARM_POS.left}%`, top: `${FARM_POS.top}%`, zIndex: 4 }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full border-[3px] border-white shadow-md"
          style={{ background: "hsl(142 60% 38%)", color: "#fff" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H10v7H5a2 2 0 0 1-2-2z" />
          </svg>
        </div>
        <div
          className="mt-1.5 px-2.5 py-1 rounded-full whitespace-nowrap shadow-md"
          style={{ fontSize: 10.5, fontWeight: 700, background: "#1f2937", color: "#fff" }}
        >
          내 농장
          <span className="ml-1.5 font-normal opacity-75">{farm.region}</span>
        </div>
      </div>
    </div>
  );
};

export default ShipmentMap;
