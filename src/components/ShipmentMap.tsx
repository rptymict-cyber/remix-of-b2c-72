import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const PRIMARY = "hsl(142, 71%, 35%)"; // 초록 강조
const GREY = "#9ca3af";

const shortMarketName = (name: string) =>
  name.replace("시장", "").replace("서울 ", "").trim();

// 내 농장 (초록 집)
const farmIcon = (region: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px)">
        <div style="width:38px;height:38px;border-radius:9999px;background:${PRIMARY};color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.18);border:3px solid #fff">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H10v7H5a2 2 0 0 1-2-2z"/></svg>
        </div>
        <div style="margin-top:4px;padding:2px 8px;border-radius:9999px;background:#111827;color:#fff;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.15)">
          내 농장 <span style="opacity:.75;font-weight:400;margin-left:2px">${region}</span>
        </div>
      </div>`,
    iconSize: [120, 60],
    iconAnchor: [60, 38],
  });

// 시장 핀
const marketIcon = (label: string, distanceKm: number, isRec: boolean, isSel: boolean) => {
  const bg = isRec ? PRIMARY : "#ffffff";
  const fg = isRec ? "#ffffff" : "#374151";
  const ring = isRec ? PRIMARY : "#d1d5db";
  const labelColor = isRec ? PRIMARY : "#374151";
  const labelBorder = isRec ? `1px solid ${PRIMARY}40` : "1px solid #e5e7eb";
  const scale = isRec ? 1.1 : isSel ? 1.05 : 1;
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:scale(${scale}) translateY(-4px);transform-origin:bottom center">
        <div style="width:32px;height:32px;border-radius:9999px;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.18);border:2px solid ${ring}">
          ${
            isRec
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><polygon points="12 2 15 9 22 9 17 14 19 22 12 18 5 22 7 14 2 9 9 9"/></svg>'
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
          }
        </div>
        <div style="margin-top:4px;padding:2px 7px;border-radius:9999px;background:#fff;color:${labelColor};font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.1);border:${labelBorder}">
          ${label} <span style="color:#6b7280;font-weight:400;margin-left:2px">${distanceKm}km</span>
        </div>
      </div>`,
    iconSize: [120, 60],
    iconAnchor: [60, 32],
  });
};

const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [map, JSON.stringify(points)]);
  return null;
};

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, onSelect }: Props) => {
  const allPoints = useMemo<[number, number][]>(
    () => [[farm.lat, farm.lng], ...markets.map((m) => [m.lat, m.lng] as [number, number])],
    [farm.lat, farm.lng, markets],
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-border bg-card"
      style={{ height: 280 }}
    >
      <MapContainer
        center={[farm.lat, farm.lng]}
        zoom={8}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%", background: "#eef3f7" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FitBounds points={allPoints} />

        {/* 농장→시장 연결선 */}
        {markets.map((m) => {
          const isRec = m.id === recommendedId;
          const isSel = m.id === selectedId;
          return (
            <Polyline
              key={`line-${m.id}`}
              positions={[
                [farm.lat, farm.lng],
                [m.lat, m.lng],
              ]}
              pathOptions={{
                color: isRec ? PRIMARY : GREY,
                weight: isRec ? 3 : 1.5,
                opacity: isRec ? 0.85 : isSel ? 0.6 : 0.35,
                dashArray: isRec ? undefined : "4 6",
                lineCap: "round",
              }}
            />
          );
        })}

        {/* 시장 마커 */}
        {markets.map((m) => {
          const isRec = m.id === recommendedId;
          const isSel = m.id === selectedId;
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={marketIcon(shortMarketName(m.name), m.distanceKm, isRec, isSel)}
              zIndexOffset={isRec ? 1000 : isSel ? 500 : 0}
              eventHandlers={{ click: () => onSelect(m.id) }}
            />
          );
        })}

        {/* 농장 마커 */}
        <Marker
          position={[farm.lat, farm.lng]}
          icon={farmIcon(farm.region)}
          zIndexOffset={2000}
          interactive={false}
        />
      </MapContainer>
    </div>
  );
};

export default ShipmentMap;
