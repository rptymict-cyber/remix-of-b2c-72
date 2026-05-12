import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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

const farmIcon = L.divIcon({
  className: "",
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-6px);">
      <div style="width:34px;height:34px;border-radius:50%;background:hsl(142 70% 35%);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:#fff;">
        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>
      </div>
      <div style="margin-top:4px;background:#111827;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.2);">내 농장 <span style="font-weight:500;opacity:.85;">__REGION__</span></div>
    </div>
  `,
  iconSize: [80, 60],
  iconAnchor: [40, 30],
});

const buildFarmIcon = (region: string) =>
  L.divIcon({
    className: "",
    html: farmIcon.options.html!.toString().replace("__REGION__", region),
    iconSize: [120, 60],
    iconAnchor: [60, 30],
  });

const buildMarketIcon = (m: MapMarket, recommended: boolean) => {
  const pinBg = recommended ? "hsl(142 70% 35%)" : "#fff";
  const pinFg = recommended ? "#fff" : "hsl(142 70% 35%)";
  const pinBorder = recommended ? "#fff" : "hsl(142 70% 35%)";
  const inner = recommended
    ? `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='${pinFg}' stroke='${pinFg}' stroke-width='1.5' stroke-linejoin='round'><polygon points='12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='${pinFg}'><circle cx='12' cy='12' r='5'/></svg>`;
  const labelBg = recommended ? "hsl(142 70% 35%)" : "#fff";
  const labelFg = recommended ? "#fff" : "#111827";
  const labelBorder = recommended ? "hsl(142 70% 35%)" : "#e5e7eb";
  const badge = recommended
    ? `<span style="background:#fff;color:hsl(142 70% 35%);font-size:9px;font-weight:800;padding:1px 4px;border-radius:4px;margin-right:4px;">추천</span>`
    : "";
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-6px);cursor:pointer;">
        <div style="width:28px;height:28px;border-radius:50%;background:${pinBg};border:2.5px solid ${pinBorder};box-shadow:0 2px 6px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;">
          ${inner}
        </div>
        <div style="margin-top:4px;background:${labelBg};color:${labelFg};border:1px solid ${labelBorder};font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15);display:flex;align-items:center;">
          ${badge}${m.name} <span style="font-weight:600;margin-left:4px;color:${recommended ? "#fff" : "hsl(142 70% 35%)"};">${m.distanceKm}km</span>
        </div>
      </div>
    `,
    iconSize: [140, 60],
    iconAnchor: [70, 30],
  });
};

const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, JSON.stringify(points)]);
  return null;
};

const ShipmentMap = ({ farm, markets, recommendedId, onSelect }: Props) => {
  const points: [number, number][] = [
    [farm.lat, farm.lng],
    ...markets.map((m) => [m.lat, m.lng] as [number, number]),
  ];
  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-[0_4px_16px_rgba(17,24,39,0.06)] border border-border">
      <MapContainer
        center={[farm.lat, farm.lng]}
        zoom={7}
        scrollWheelZoom={false}
        style={{ height: 320, width: "100%" }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />
        <Marker position={[farm.lat, farm.lng]} icon={buildFarmIcon(farm.region)} />
        {markets.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={buildMarketIcon(m, m.id === recommendedId)}
            eventHandlers={{ click: () => onSelect(m.id) }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default ShipmentMap;
