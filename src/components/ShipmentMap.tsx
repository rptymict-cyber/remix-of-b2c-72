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
      <div style="width:34px;height:34px;border-radius:50%;background:hsl(var(--primary));border:3px solid hsl(var(--primary-foreground));box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:hsl(var(--primary-foreground));">
        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>
      </div>
      <div style="margin-top:4px;background:#111827;color:hsl(var(--primary-foreground));font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.2);">내 농장 <span style="font-weight:500;opacity:.85;">__REGION__</span></div>
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
  const netRevenue = m.netRevenue?.toLocaleString() ?? "-";

  if (recommended) {
    return L.divIcon({
      className: "",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-12px);cursor:pointer;position:relative;">
          <style>
            @keyframes shipment-recommend-pulse {
              0% { transform: scale(.72); opacity: .42; }
              70% { transform: scale(1.75); opacity: 0; }
              100% { transform: scale(1.75); opacity: 0; }
            }
          </style>
          <div style="position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;">
            <span style="position:absolute;width:38px;height:38px;border-radius:999px;background:hsl(var(--primary) / .32);animation:shipment-recommend-pulse 1.6s ease-out infinite;"></span>
            <div style="position:relative;width:36px;height:36px;border-radius:50%;background:hsl(var(--primary));border:3px solid hsl(var(--primary-foreground));box-shadow:0 4px 12px hsl(var(--primary) / .32);display:flex;align-items:center;justify-content:center;color:hsl(var(--primary-foreground));">
              <svg xmlns='http://www.w3.org/2000/svg' width='17' height='17' viewBox='0 0 24 24' fill='hsl(var(--primary-foreground))' stroke='hsl(var(--primary-foreground))' stroke-width='1.5' stroke-linejoin='round'><polygon points='12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9'/></svg>
            </div>
          </div>
          <div style="margin-top:5px;background:hsl(142 70% 35%);color:hsl(var(--primary-foreground));border:1px solid hsl(142 70% 35%);font-size:10px;font-weight:800;line-height:1.35;padding:5px 8px;border-radius:9px;white-space:nowrap;box-shadow:0 4px 12px hsl(var(--primary) / .26);text-align:left;">
            <div style="font-size:10px;font-weight:900;margin-bottom:2px;">🏆 순이익 1위</div>
            <div>${m.name} <span style="margin-left:4px;font-weight:800;">${m.distanceKm}km</span></div>
            <div style="font-size:9px;font-weight:700;opacity:.92;margin-top:1px;">예상 순이익 ${netRevenue}원</div>
          </div>
        </div>
      `,
      iconSize: [190, 96],
      iconAnchor: [95, 42],
    });
  }

  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-6px);cursor:pointer;">
        <div style="width:28px;height:28px;border-radius:50%;background:hsl(var(--muted-foreground));border:2.5px solid hsl(var(--background));box-shadow:0 2px 6px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;color:hsl(var(--primary-foreground));">
          <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='hsl(var(--background))'><circle cx='12' cy='12' r='5'/></svg>
        </div>
        <div style="margin-top:4px;background:hsl(var(--background));color:hsl(var(--foreground));border:1px solid hsl(var(--border));font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15);">
          ${m.name} <span style="font-weight:700;margin-left:4px;color:hsl(var(--muted-foreground));">${m.distanceKm}km</span>
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

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, onSelect }: Props) => {
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
        {markets.map((m) => {
          const recommended = m.id === recommendedId;
          const selected = m.id === selectedId;
          return (
            <Marker
              key={`${m.id}-${recommended}-${selected}`}
              zIndexOffset={recommended || selected ? 1000 : 0}
              position={[m.lat, m.lng]}
              icon={buildMarketIcon(m, recommended)}
              eventHandlers={{ click: () => onSelect(m.id) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ShipmentMap;
