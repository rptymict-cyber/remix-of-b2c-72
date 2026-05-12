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
  disabled?: boolean;
  onSelect: (id: string) => void;
}

// Anchor point is at the bottom-center of every icon (where the pin tip / circle bottom is).
// All icons share the same iconSize / iconAnchor so toggling recommended state never shifts position.
const ICON_W = 200;
const ICON_H = 140;
const ANCHOR: [number, number] = [ICON_W / 2, ICON_H];

const greenPinSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='hsl(var(--primary))' stroke='hsl(var(--primary-foreground))' stroke-width='1.5' stroke-linejoin='round'><path d='M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z'/><circle cx='12' cy='9' r='2.5' fill='hsl(var(--primary-foreground))' stroke='none'/></svg>`;
const smallGreenPinSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='hsl(var(--primary))'><path d='M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z'/></svg>`;

const buildFarmIcon = (region: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        <div style="width:34px;height:34px;border-radius:50%;background:hsl(var(--primary));border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:#fff;">
          <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>
        </div>
        <div style="margin-top:4px;background:#111;color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.2);">내 농장 <span style="font-weight:500;opacity:.85;margin-left:2px;">${region}</span></div>
      </div>
    `,
    iconSize: [ICON_W, ICON_H],
    iconAnchor: [ICON_W / 2, 17], // farm circle center sits on the coordinate
  });

const buildMarketIcon = (m: MapMarket, recommended: boolean) => {
  if (recommended) {
    return L.divIcon({
      className: "",
      html: `
        <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
          <div style="position:relative;background:#fff;border:1.5px solid hsl(var(--primary));border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,.12);padding:18px 10px 8px;white-space:nowrap;">
            <span style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:hsl(var(--primary));color:#fff;font-size:9px;font-weight:800;padding:2px 8px;border-radius:999px;letter-spacing:.2px;">추천 시장</span>
            <div style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:800;color:#111;">
              <span style="font-size:11px;">⭐</span>
              ${smallGreenPinSvg}
              <span>${m.name}</span>
              <span style="color:hsl(var(--muted-foreground));font-weight:700;">${m.distanceKm}km</span>
            </div>
          </div>
          <div style="margin-top:-1px;">${greenPinSvg}</div>
        </div>
      `,
      iconSize: [ICON_W, ICON_H],
      iconAnchor: ANCHOR,
    });
  }

  return L.divIcon({
    className: "",
    html: `
      <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
        <div style="background:#fff;border:1px solid hsl(var(--border));border-radius:9px;box-shadow:0 3px 8px rgba(0,0,0,.1);padding:4px 8px;white-space:nowrap;font-size:10px;font-weight:700;color:#111;">
          ${m.name} <span style="color:hsl(var(--muted-foreground));margin-left:2px;">${m.distanceKm}km</span>
        </div>
        <div style="margin-top:-1px;">${greenPinSvg}</div>
      </div>
    `,
    iconSize: [ICON_W, ICON_H],
    iconAnchor: ANCHOR,
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

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, disabled = false, onSelect }: Props) => {
  const points: [number, number][] = [
    [farm.lat, farm.lng],
    ...markets.map((m) => [m.lat, m.lng] as [number, number]),
  ];
  return (
    <div className="map-wrapper rounded-3xl bg-white shadow-[0_4px_16px_rgba(17,24,39,0.06)] border border-border" data-map-disabled={disabled}>
      <MapContainer
        className="map-container"
        center={[farm.lat, farm.lng]}
        zoom={7}
        scrollWheelZoom={false}
        style={{ height: 320, width: "100%" }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />
        <Marker position={[farm.lat, farm.lng]} icon={buildFarmIcon(farm.region)} />
        {markets.map((m) => {
          const recommended = m.id === recommendedId;
          const selected = m.id === selectedId;
          return (
            <Marker
              key={`${m.id}-${recommended}-${selected}`}
              zIndexOffset={recommended || selected ? 1000 : 0}
              position={[m.lat, m.lng]}
              icon={buildMarketIcon(m, recommended)}
              draggable={false}
              eventHandlers={{ click: () => onSelect(m.id) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ShipmentMap;
