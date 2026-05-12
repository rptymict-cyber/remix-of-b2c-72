import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, MapPin, Truck, Star, CheckCircle2, Info, Package, Tag } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { CROPS, MARKETS, findCrop, seedPrice, transportCost } from "@/data/catalog";
import CropSheet from "@/components/sheets/CropSheet";
import QtySheet from "@/components/sheets/QtySheet";
import MarketDetailSheet from "@/components/sheets/MarketDetailSheet";
import LocationSheet, { shortCity } from "@/components/sheets/LocationSheet";
import FilterPill from "@/components/common/FilterPill";
import ShipmentMap from "@/components/ShipmentMap";
import SortSheet, { SortOption } from "@/components/sheets/SortSheet";

// 시장별 대략 좌표 (한국 지도상 위치)
const MARKET_COORDS: Record<string, { lat: number; lng: number }> = {
  garak: { lat: 37.4925, lng: 127.1186 },
  gangseo: { lat: 37.5509, lng: 126.8495 },
  daegu: { lat: 35.9078, lng: 128.6014 },
  busan: { lat: 35.1539, lng: 128.9707 },
  anyang: { lat: 37.3943, lng: 126.9568 },
  gwangju: { lat: 35.1525, lng: 126.8526 },
  suwon: { lat: 37.2636, lng: 127.0286 },
  cheongju: { lat: 36.6424, lng: 127.4890 },
};
const FARM_COORD = { lat: 36.4467, lng: 127.1188 }; // 충남 공주시

type SortKey = "netRevenue" | "unitPrice" | "logistics" | "distance";

const sortLabels: Record<SortKey, string> = {
  netRevenue: "순이익 높은순",
  unitPrice: "단가 높은순",
  logistics: "물류비 낮은순",
  distance: "가까운순",
};

const SalesChannelPage = () => {
  const { cropId, profile, shipQtyKg, basis, setBasis, setProfile } = useApp();
  const [sortBy, setSortBy] = useState<SortKey>("netRevenue");
  const [cropOpen, setCropOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [detailMarketId, setDetailMarketId] = useState<string | null>(null);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [locOpen, setLocOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>([
    "전라북도 김제시",
    "경상북도 안동시",
  ]);

  const crop = findCrop(cropId);
  const unitWeight = crop.defaultUnitKg;
  const boxes = Math.max(1, Math.round(shipQtyKg / unitWeight));

  const rows = MARKETS.map((m) => {
    let unitPrice = seedPrice(cropId, m.id);
    if (basis === "forecast") unitPrice = Math.round(unitPrice * 1.08);
    const totalRevenue = unitPrice * boxes;
    const logistics = transportCost(m.distanceKm, shipQtyKg);
    const netRevenue = totalRevenue - logistics;
    return { m, unitPrice, totalRevenue, logistics, netRevenue };
  });

  const sorted = [...rows].sort((a, b) => {
    if (sortBy === "netRevenue") return b.netRevenue - a.netRevenue;
    if (sortBy === "unitPrice") return b.unitPrice - a.unitPrice;
    if (sortBy === "logistics") return a.logistics - b.logistics;
    return a.m.distanceKm - b.m.distanceKm;
  });

  const best = sorted[0];
  const detail = detailMarketId ? sorted.find((r) => r.m.id === detailMarketId) : null;
  const detailRank = detail ? sorted.indexOf(detail) + 1 : 0;

  // 추천 시장이 바뀌면 지도 선택 자동 업데이트
  useEffect(() => {
    setSelectedMapId(best.m.id);
  }, [best.m.id]);

  // 출하 위치 비교 지도: 주요 3개 시장만 노출 (마커 겹침 방지)
  const MAP_MARKET_IDS = ["suwon", "garak", "daegu"] as const;
  const mapMarkets = MAP_MARKET_IDS
    .map((id) => sorted.find((s) => s.m.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      id: s.m.id,
      name: s.m.name,
      distanceKm: s.m.distanceKm,
      lat: MARKET_COORDS[s.m.id]?.lat ?? 37,
      lng: MARKET_COORDS[s.m.id]?.lng ?? 127.5,
      netRevenue: s.netRevenue,
      unitPrice: s.unitPrice,
      logistics: s.logistics,
    }));
  const selectedMap = mapMarkets.find((m) => m.id === selectedMapId) || mapMarkets[0];

  return (
    <div className="h-full bg-background">
      <AppHeader title="판매처 추천" />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+1.25rem)] safe-bottom space-y-4">
        {/* 조건 */}
        <div className="grid grid-cols-3 gap-2">
          <FilterPill onClick={() => setCropOpen(true)} icon={<span className="text-base leading-none">{crop.emoji}</span>} label={crop.name} className="px-2.5" />
          <FilterPill onClick={() => setQtyOpen(true)} icon={<Package className="w-4 h-4" />} label={`${shipQtyKg.toLocaleString()}kg · ${boxes}상자`} className="px-2.5" />
          <FilterPill onClick={() => setLocOpen(true)} icon={<MapPin className="w-4 h-4" />} label={shortCity(profile.region)} className="px-2.5" />
        </div>

        {/* 시세 기준 전환 */}
        <div className="flex bg-secondary rounded-full p-1 w-full">
          {(["current", "forecast"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBasis(b)}
              className={`flex-1 text-sm py-2.5 rounded-full font-semibold transition-colors ${basis === b ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {b === "current" ? "현재가 기준" : "예측가 기준"}
            </button>
          ))}
        </div>

        {/* 추천 요약 */}
        <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">🥇 순이익 최고</span>
          </div>
          <p className="text-xl font-bold text-foreground">{best.m.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            예상 순이익 <span className="font-bold text-primary text-base">{best.netRevenue.toLocaleString()}원</span>
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">단가</p>
              <p className="text-xs font-bold text-foreground">{best.unitPrice.toLocaleString()}원</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">물류비</p>
              <p className="text-xs font-bold text-foreground">{best.logistics.toLocaleString()}원</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">거리</p>
              <p className="text-xs font-bold text-foreground">{best.m.distanceKm}km</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>단가 대비 물류비가 가장 효율적입니다</span>
          </div>
        </div>

        {/* 인사이트 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[11px] text-foreground leading-relaxed">
            💡 <span className="font-semibold">단가</span>만 보면 가락시장이 1위지만,
            <span className="font-semibold"> 물류비 포함 실질 순이익</span>은 <span className="font-bold text-primary">{best.m.name}</span>이 더 높습니다.
          </p>
        </div>

        {/* 출하 위치 비교 지도 */}
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" /> 출하 위치 비교
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                내 농장과 주요 도매시장의 위치를 비교해 출하 거리와 추천 판매처를 확인하세요.
              </p>
            </div>
          </div>
          <ShipmentMap
            farm={{ name: "내 농장", region: profile.region, lat: FARM_COORD.lat, lng: FARM_COORD.lng }}
            markets={mapMarkets}
            recommendedId={best.m.id}
            selectedId={selectedMapId}
            onSelect={setSelectedMapId}
          />
          {selectedMap && (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {selectedMap.id === best.m.id && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md">추천</span>
                  )}
                  <span className="text-[17px] font-extrabold text-foreground tracking-tight">{selectedMap.name}</span>
                </div>
                <span className="text-[12px] text-primary flex items-center gap-1 font-semibold">
                  <Truck className="w-4 h-4" /> {selectedMap.distanceKm}km
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card border border-border rounded-xl px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px] mb-1">
                    <Tag className="w-3 h-3 text-primary" /> 예상 단가
                  </div>
                  <p className="font-extrabold text-foreground text-[14px]">{selectedMap.unitPrice?.toLocaleString()}원</p>
                </div>
                <div className="bg-card border border-border rounded-xl px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px] mb-1">
                    <Truck className="w-3 h-3 text-primary" /> 물류비
                  </div>
                  <p className="font-extrabold text-foreground text-[14px]">{selectedMap.logistics?.toLocaleString()}원</p>
                </div>
                <div className="bg-card border border-border rounded-xl px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px] mb-1">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-white text-[8px] font-bold leading-none">₩</span> 예상 순이익
                  </div>
                  <p className="font-extrabold text-primary text-[14px]">{selectedMap.netRevenue?.toLocaleString()}원</p>
                </div>
              </div>
              <button
                onClick={() => setDetailMarketId(selectedMap.id)}
                className="mt-3 relative w-full h-12 rounded-2xl bg-primary text-white text-sm font-bold flex items-center justify-center"
              >
                <span>이 시장 자세히 보기</span>
                <ChevronRight className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2" />
              </button>
            </div>
          )}
        </section>

        {/* 정렬 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">시장 랭킹</span>
          <button
            className="text-[11px] text-primary flex items-center gap-0.5 font-medium"
            onClick={() => setSortOpen(true)}
          >
            {sortLabels[sortBy]} <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* 비교 리스트 */}
        <div className="space-y-2">
          {sorted.map((s, i) => {
            const recommended = i === 0;
            const rank = i + 1;
            const rankBadge = rank === 1
              ? { emoji: "🥇", label: "1위", bg: "bg-gradient-to-br from-amber-300 to-yellow-500", text: "text-white" }
              : rank === 2
              ? { emoji: "🥈", label: "2위", bg: "bg-gradient-to-br from-slate-200 to-slate-400", text: "text-white" }
              : rank === 3
              ? { emoji: "🥉", label: "3위", bg: "bg-gradient-to-br from-amber-500 to-orange-700", text: "text-white" }
              : { emoji: "", label: `${rank}위`, bg: "bg-secondary", text: "text-muted-foreground" };
            const mapActive = selectedMapId === s.m.id;
            return (
              <button
                key={s.m.id}
                onClick={() => {
                  setSelectedMapId(s.m.id);
                  setDetailMarketId(s.m.id);
                }}
                className={`w-full text-left bg-card rounded-2xl border p-3 ${
                  mapActive ? "border-primary ring-2 ring-primary/20" : recommended ? "border-primary/30" : "border-border"
                } relative active:scale-[0.99] transition-transform`}
              >
                {recommended && (
                  <div className="absolute -top-2 right-3 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">추천</div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${rankBadge.bg} ${rankBadge.text} pl-1 pr-2 py-0.5 rounded-full shadow-sm`}>
                      {rankBadge.emoji && <span className="text-base leading-none">{rankBadge.emoji}</span>}
                      <span className="text-[11px] font-extrabold tracking-tight">{rankBadge.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{s.m.name}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Truck className="w-3 h-3" />{s.m.distanceKm}km
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {s.unitPrice.toLocaleString()}<span className="text-[10px] font-normal text-muted-foreground">원/{unitWeight}kg</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <p className="text-muted-foreground">총매출</p>
                    <p className="font-semibold text-foreground">{s.totalRevenue.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">물류비</p>
                    <p className="font-semibold text-foreground">-{s.logistics.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">순이익</p>
                    <p className="font-bold text-primary">{s.netRevenue.toLocaleString()}원</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 비용 기준 안내 */}
        <div className="bg-secondary/50 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-0.5">계산 기준</p>
            <p>물류비: 5톤 트럭 기준 추정치, 출발지 {profile.region}. 실제 비용은 계약 업체에 따라 다를 수 있습니다.</p>
          </div>
        </div>
      </main>

      <BottomNav />
      <CropSheet open={cropOpen} onOpenChange={setCropOpen} />
      <QtySheet open={qtyOpen} onOpenChange={setQtyOpen} />
      <LocationSheet
        open={locOpen}
        onOpenChange={setLocOpen}
        currentRegion={profile.region}
        selectedRegion={profile.region}
        recents={recents}
        onConfirm={(region) => {
          setProfile({ region });
          setRecents((prev) => {
            const next = [region, ...prev.filter((r) => r !== region && r !== profile.region)];
            return next.slice(0, 5);
          });
        }}
      />
      <MarketDetailSheet
        open={!!detailMarketId}
        onOpenChange={(o) => !o && setDetailMarketId(null)}
        detail={detail ? {
          marketId: detail.m.id,
          rank: detailRank,
          unitPrice: detail.unitPrice,
          totalRevenue: detail.totalRevenue,
          logistics: detail.logistics,
          netRevenue: detail.netRevenue,
          unitWeight,
        } : null}
      />
      <SortSheet<SortKey>
        open={sortOpen}
        onOpenChange={setSortOpen}
        title="정렬 기준"
        selected={sortBy}
        onSelect={setSortBy}
        options={[
          { key: "netRevenue", label: "순이익 높은순" },
          { key: "unitPrice", label: "단가 높은순" },
          { key: "logistics", label: "물류비 낮은순" },
          { key: "distance", label: "가까운순" },
        ] as SortOption<SortKey>[]}
      />
    </div>
  );
};

export default SalesChannelPage;
