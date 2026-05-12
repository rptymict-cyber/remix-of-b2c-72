import mapStatic from "@/assets/shipment-map-static.png";

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

// 정적 레퍼런스 이미지 위에 얹히는 클릭 영역 좌표(% 단위)
// 이미지에 이미 그려진 마커 위치 기준
const HIT_AREAS: Record<string, { left: number; top: number; w: number; h: number }> = {
  garak:  { left: 50,   top: 16, w: 26, h: 12 },
  suwon:  { left: 38,   top: 32, w: 36, h: 16 },
  daegu:  { left: 75,   top: 56, w: 30, h: 12 },
};

const ShipmentMap = ({ markets, onSelect }: Props) => {
  return (
    <div
      className="relative rounded-3xl overflow-hidden bg-white shadow-[0_4px_16px_rgba(17,24,39,0.06)]"
    >
      <img
        src={mapStatic}
        alt="대한민국 출하 위치도"
        draggable={false}
        className="block w-full h-auto select-none pointer-events-none"
      />

      {markets.map((m) => {
        const hit = HIT_AREAS[m.id];
        if (!hit) return null;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            aria-label={`${m.name} 선택`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none"
            style={{
              left: `${hit.left}%`,
              top: `${hit.top}%`,
              width: `${hit.w}%`,
              height: `${hit.h}%`,
              background: "transparent",
            }}
          />
        );
      })}
    </div>
  );
};

export default ShipmentMap;
