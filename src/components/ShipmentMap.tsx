import koreaMap from "@/assets/korea-map-clean.png";
import { Home, Star, MapPin } from "lucide-react";

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

// 지도 위 마커 좌표(% 단위) — 한국 지도 이미지 기준
const MARKET_POS: Record<string, { left: number; top: number; labelSide: "left" | "right" }> = {
  garak:  { left: 60, top: 38, labelSide: "right" },
  suwon:  { left: 55, top: 46, labelSide: "left" },
  daegu:  { left: 66, top: 62, labelSide: "right" },
};
const FARM_POS = { left: 51, top: 56 };

const shortName = (name: string) => name.replace(/시장$/, "").replace(/도매시장$/, "");

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, onSelect }: Props) => {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-white border border-border shadow-[0_4px_16px_rgba(17,24,39,0.06)]">
      {/* 지도 배경 */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: "5 / 4",
          backgroundImage: `url(${koreaMap})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 시장 마커 */}
        {markets.map((m) => {
          const pos = MARKET_POS[m.id];
          if (!pos) return null;
          const isRec = m.id === recommendedId;
          const isSel = m.id === selectedId;
          const labelRight = pos.labelSide === "right";

          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              aria-label={`${m.name} 선택`}
              className="absolute z-20 flex items-center gap-1.5"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: `translate(-50%, -50%) ${labelRight ? "" : "scaleX(-1)"}`,
                flexDirection: "row",
              }}
            >
              <span
                className={`relative inline-flex items-center justify-center rounded-full border-2 ${
                  isRec
                    ? "w-9 h-9 bg-primary border-white shadow-[0_2px_8px_rgba(34,139,76,0.45)]"
                    : isSel
                    ? "w-7 h-7 bg-primary/90 border-white shadow-md"
                    : "w-6 h-6 bg-white border-primary/70 shadow-sm"
                }`}
              >
                {isRec ? (
                  <Star className="w-4 h-4 text-white fill-white" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${isSel ? "bg-white" : "bg-primary"}`} />
                )}
                {isRec && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping opacity-60" />
                )}
              </span>
              <span
                style={labelRight ? undefined : { transform: "scaleX(-1)" }}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold border ${
                  isRec
                    ? "bg-primary text-white border-primary shadow-md"
                    : isSel
                    ? "bg-white text-primary border-primary"
                    : "bg-white text-foreground border-border shadow-sm"
                }`}
              >
                {shortName(m.name)} <span className={`font-semibold ${isRec ? "text-white/90" : "text-muted-foreground"}`}>{m.distanceKm}km</span>
              </span>
            </button>
          );
        })}

        {/* 내 농장 마커 */}
        <div
          className="absolute z-10 flex items-center gap-1.5 pointer-events-none"
          style={{
            left: `${FARM_POS.left}%`,
            top: `${FARM_POS.top}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground border-2 border-white shadow-md">
            <Home className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold bg-foreground text-white shadow-md">
            내 농장 <span className="font-semibold text-white/70">{farm.region}</span>
          </span>
        </div>
      </div>

      {/* 추천 시장 안내 칩 */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur rounded-full pl-1.5 pr-2.5 py-1 shadow-sm border border-border">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary">
          <Star className="w-3 h-3 text-white fill-white" />
        </span>
        <span className="text-[11px] font-bold text-foreground">추천 시장</span>
      </div>
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur rounded-full px-2 py-1 shadow-sm border border-border">
        <MapPin className="w-3 h-3 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-muted-foreground">탭하여 비교</span>
      </div>
    </div>
  );
};

export default ShipmentMap;
