import { useState } from "react";
import { ChevronDown, MapPin, Truck, Star, CheckCircle2, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { CROPS, MARKETS, findCrop, seedPrice, transportCost } from "@/data/catalog";
import CropSheet from "@/components/sheets/CropSheet";
import QtySheet from "@/components/sheets/QtySheet";
import MarketDetailSheet from "@/components/sheets/MarketDetailSheet";

type SortKey = "netRevenue" | "unitPrice" | "logistics" | "distance";

const sortLabels: Record<SortKey, string> = {
  netRevenue: "순이익순",
  unitPrice: "단가 높은순",
  logistics: "물류비 낮은순",
  distance: "가까운 순",
};

const SalesChannelPage = () => {
  const { cropId, profile, shipQtyKg, basis, setBasis } = useApp();
  const [sortBy, setSortBy] = useState<SortKey>("netRevenue");
  const [cropOpen, setCropOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [detailMarketId, setDetailMarketId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="판매처 추천" />

      <main className="px-4 pt-5 safe-bottom space-y-4">
        {/* 조건 */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setCropOpen(true)} className="filter-chip justify-center text-xs px-2 py-1.5">
            <span className="text-sm">{crop.emoji}</span>{crop.name}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={() => setQtyOpen(true)} className="filter-chip justify-center text-xs px-2 py-1.5">
            {shipQtyKg.toLocaleString()}kg · {boxes}상자
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          <button className="filter-chip justify-center text-xs px-2 py-1.5">
            출발 {profile.region}
          </button>
          <div className="flex bg-secondary rounded-full p-0.5">
            {(["current", "forecast"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBasis(b)}
                className={`flex-1 text-xs py-1.5 rounded-full font-medium ${basis === b ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {b === "current" ? "현재가" : "예측가"}
              </button>
            ))}
          </div>
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

        {/* 정렬 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">시장 랭킹</span>
          <button
            className="text-[11px] text-primary flex items-center gap-0.5 font-medium"
            onClick={() => {
              const keys: SortKey[] = ["netRevenue", "unitPrice", "logistics", "distance"];
              setSortBy(keys[(keys.indexOf(sortBy) + 1) % keys.length]);
            }}
          >
            {sortLabels[sortBy]} <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* 비교 리스트 */}
        <div className="space-y-2">
          {sorted.map((s, i) => {
            const recommended = i === 0;
            const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}위`;
            return (
              <button
                key={s.m.id}
                onClick={() => setDetailMarketId(s.m.id)}
                className={`w-full text-left bg-card rounded-2xl border p-3 ${recommended ? "border-primary/30" : "border-border"} relative active:scale-[0.99] transition-transform`}
              >
                {recommended && (
                  <div className="absolute -top-2 right-3 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">추천</div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{medal}</span>
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
    </div>
  );
};

export default SalesChannelPage;
