import { useEffect, useMemo, useRef } from "react";
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
const ICON_W = 220;
const ICON_H = 150;

// dir: where the bubble sits relative to the pin tip.
// 'top'    -> bubble above pin (default), anchor at bottom-center (pin tip on coord)
// 'bottom' -> bubble below pin, anchor at top-center
// 'left'   -> bubble to the left of pin, anchor at right-center
// 'right'  -> bubble to the right of pin, anchor at left-center
type BubbleDir = "top" | "bottom" | "left" | "right";

const anchorFor = (dir: BubbleDir): [number, number] => {
  switch (dir) {
    case "bottom":
      return [ICON_W / 2, 0];
    case "left":
      return [ICON_W, ICON_H / 2];
    case "right":
      return [0, ICON_H / 2];
    case "top":
    default:
      return [ICON_W / 2, ICON_H];
  }
};

const wrapperStyleFor = (dir: BubbleDir) => {
  // Position the inner content (bubble + pin) so it grows away from the anchor
  switch (dir) {
    case "bottom":
      // anchor at top -> content grows downward, pin on top
      return "position:absolute;left:50%;top:0;transform:translateX(-50%);display:flex;flex-direction:column-reverse;align-items:center;";
    case "left":
      // anchor at right -> content grows leftward
      return "position:absolute;right:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:row-reverse;align-items:center;gap:2px;";
    case "right":
      return "position:absolute;left:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:row;align-items:center;gap:2px;";
    case "top":
    default:
      return "position:absolute;left:50%;bottom:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;";
  }
};

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

const buildMarketIcon = (m: MapMarket, recommended: boolean, selected: boolean, dir: BubbleDir) => {
  const wrapper = wrapperStyleFor(dir);
  const scale = selected ? 1.1 : 1;
  const tapPad = `min-width:48px;min-height:48px;display:flex;align-items:center;justify-content:center;`;
  if (recommended) {
    return L.divIcon({
      className: "",
      html: `
        <div style="${wrapper}pointer-events:auto;cursor:pointer;transform-origin:center;${dir === "top" ? "transform:translateX(-50%) scale(" + scale + ");" : dir === "bottom" ? "transform:translateX(-50%) scale(" + scale + ");" : "transform:translateY(-50%) scale(" + scale + ");"}">
          <div style="${tapPad}">
            <div style="position:relative;background:#fff;border:${selected ? "2px" : "1.5px"} solid hsl(var(--primary));border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,.12);padding:18px 10px 8px;white-space:nowrap;">
              <span style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:hsl(var(--primary));color:#fff;font-size:9px;font-weight:800;padding:2px 8px;border-radius:999px;letter-spacing:.2px;">추천 시장</span>
              <div style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:800;color:#111;">
                <span style="font-size:11px;">⭐</span>
                ${smallGreenPinSvg}
                <span>${m.name}</span>
                <span style="color:hsl(var(--muted-foreground));font-weight:700;">${m.distanceKm}km</span>
              </div>
            </div>
          </div>
          <div>${greenPinSvg}</div>
        </div>
      `,
      iconSize: [ICON_W, ICON_H],
      iconAnchor: anchorFor(dir),
    });
  }

  return L.divIcon({
    className: "",
    html: `
      <div style="${wrapper}pointer-events:auto;cursor:pointer;${dir === "top" || dir === "bottom" ? "transform:translateX(-50%) scale(" + scale + ");" : "transform:translateY(-50%) scale(" + scale + ");"}">
        <div style="${tapPad}">
          <div style="background:#fff;border:${selected ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))"};border-radius:9px;box-shadow:0 3px 8px rgba(0,0,0,.1);padding:4px 8px;white-space:nowrap;font-size:10px;font-weight:700;color:#111;">
            ${m.name} <span style="color:hsl(var(--muted-foreground));margin-left:2px;">${m.distanceKm}km</span>
          </div>
        </div>
        <div>${greenPinSvg}</div>
      </div>
    `,
    iconSize: [ICON_W, ICON_H],
    iconAnchor: anchorFor(dir),
  });
};

const LockedView = ({ points, onBackgroundClick }: { points: [number, number][]; onBackgroundClick: () => void }) => {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60] });
    // Zoom in one extra step so markers occupy ~70-80% of the viewport
    const targetZoom = Math.min(map.getZoom() + 1, 12);
    map.setView(bounds.getCenter(), targetZoom, { animate: false });
    // Lock viewport completely
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if ((map as any).tap) (map as any).tap.disable();
    map.zoomControl?.remove();
    const onClick = () => onBackgroundClick();
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map, JSON.stringify(points)]);
  return null;
};

// Decide bubble direction per market based on its position relative to centroid of all points.
const computeDirections = (
  farm: { lat: number; lng: number },
  markets: MapMarket[],
): Record<string, BubbleDir> => {
  const all = [farm, ...markets];
  const cLat = all.reduce((s, p) => s + p.lat, 0) / all.length;
  const cLng = all.reduce((s, p) => s + p.lng, 0) / all.length;
  const result: Record<string, BubbleDir> = {};
  markets.forEach((m) => {
    const dLat = m.lat - cLat;
    const dLng = m.lng - cLng;
    // Prefer top/bottom unless horizontal offset dominates significantly
    if (Math.abs(dLng) > Math.abs(dLat) * 1.3) {
      result[m.id] = dLng > 0 ? "left" : "right";
    } else {
      // upper part of map -> bubble below, lower part -> bubble above
      result[m.id] = dLat > 0 ? "top" : "bottom";
    }
  });
  return result;
};

const ShipmentMap = ({ farm, markets, recommendedId, selectedId, disabled = false, onSelect }: Props) => {
  const points: [number, number][] = [
    [farm.lat, farm.lng],
    ...markets.map((m) => [m.lat, m.lng] as [number, number]),
  ];
  const directions = useMemo(() => computeDirections(farm, markets), [farm, markets]);
  return (
    <div className="map-wrapper rounded-3xl bg-white shadow-[0_4px_16px_rgba(17,24,39,0.06)] border border-border overflow-hidden" data-map-disabled={disabled}>
      <MapContainer
        className="map-container"
        center={[farm.lat, farm.lng]}
        zoom={7}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        style={{ height: 320, width: "100%" }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LockedView
          points={points}
          onBackgroundClick={() => {
            if (selectedId && selectedId !== recommendedId) onSelect(recommendedId);
          }}
        />
        <Marker position={[farm.lat, farm.lng]} icon={buildFarmIcon(farm.region)} />
        {markets.map((m) => {
          const recommended = m.id === recommendedId;
          const selected = m.id === selectedId;
          const dir = directions[m.id] ?? "top";
          return (
            <Marker
              key={`${m.id}-${recommended}-${selected}-${dir}`}
              zIndexOffset={recommended || selected ? 1000 : 0}
              position={[m.lat, m.lng]}
              icon={buildMarketIcon(m, recommended, selected, dir)}
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
