import { useState } from "react";
import { ChevronDown, MapPin, Truck, Star, ArrowUpRight, CheckCircle2, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const salesData = [
  { name: "대구북부", unitPrice: 9100, totalRevenue: 345800, logistics: 42000, netRevenue: 303800, distance: "82km", time: "1시간 20분", recommended: true, reason: "물류비 반영 후 순매출 최고" },
  { name: "서울 가락", unitPrice: 9350, totalRevenue: 355300, logistics: 98000, netRevenue: 257300, distance: "210km", time: "3시간", recommended: false, reason: "단가 최고, 물류비 높음" },
  { name: "안양", unitPrice: 9020, totalRevenue: 342760, logistics: 85000, netRevenue: 257760, distance: "185km", time: "2시간 40분", recommended: false, reason: "거래량 안정적" },
  { name: "대전 오정", unitPrice: 8850, totalRevenue: 336300, logistics: 35000, netRevenue: 301300, distance: "48km", time: "50분", recommended: false, reason: "가까운 거리, 낮은 물류비" },
  { name: "부산 엄궁", unitPrice: 8780, totalRevenue: 333640, logistics: 120000, netRevenue: 213640, distance: "280km", time: "3시간 30분", recommended: false, reason: "거래량 대비 단가 보통" },
];

type SortKey = "netRevenue" | "unitPrice" | "distance";

const SalesChannelPage = () => {
  const [sortBy, setSortBy] = useState<SortKey>("netRevenue");

  const sortLabels: Record<SortKey, string> = { netRevenue: "순매출 높은 순", unitPrice: "단가 높은 순", distance: "가까운 순" };

  const sorted = [...salesData].sort((a, b) => {
    if (sortBy === "netRevenue") return b.netRevenue - a.netRevenue;
    if (sortBy === "unitPrice") return b.unitPrice - a.unitPrice;
    return parseInt(a.distance) - parseInt(b.distance);
  });

  const best = sorted[0];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="판매처 추천" subtitle="최적 출하처 비교" />

      <main className="px-4 pt-5 safe-bottom space-y-4">
        {/* 조건 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {["상추 · 청상추 ▾", "충북 충주 ▾", "38상자 ▾", "2kg 상자 ▾"].map((l) => (
            <button key={l} className="filter-chip flex-shrink-0">{l}</button>
          ))}
        </div>

        {/* 추천 요약 */}
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">AI 추천 판매처</span>
          </div>
          <p className="text-xl font-bold text-foreground">{best.name}</p>
          <p className="text-xs text-muted-foreground mt-1">예상 순매출 <span className="font-bold text-foreground">{best.netRevenue.toLocaleString()}원</span></p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">예상 단가</p>
              <p className="text-xs font-bold text-foreground">{best.unitPrice.toLocaleString()}원</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">물류비</p>
              <p className="text-xs font-bold text-foreground">{best.logistics.toLocaleString()}원</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">거리</p>
              <p className="text-xs font-bold text-foreground">{best.distance}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{best.reason}</span>
          </div>
        </div>

        {/* 위치 요약 */}
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">출하 위치 비교</span>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="w-3 h-3 bg-primary rounded-full mx-auto mb-1" />
              <p className="text-[10px] font-medium text-foreground">내 농장</p>
              <p className="text-[10px] text-muted-foreground">충북 충주시</p>
              <div className="flex gap-3 mt-3 justify-center">
                {sorted.slice(0, 3).map((s, i) => (
                  <div key={s.name} className="text-center">
                    <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-0.5 ${s.recommended ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    <p className="text-[9px] font-medium">{s.name}</p>
                    <p className="text-[9px] text-muted-foreground">{s.distance}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 정렬 */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">판매처 비교</span>
          <button
            className="text-[10px] text-primary flex items-center gap-0.5"
            onClick={() => {
              const keys: SortKey[] = ["netRevenue", "unitPrice", "distance"];
              const idx = keys.indexOf(sortBy);
              setSortBy(keys[(idx + 1) % keys.length]);
            }}
          >
            {sortLabels[sortBy]} <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* 비교 리스트 */}
        <div className="space-y-2">
          {sorted.map((s, i) => (
            <div key={s.name} className={`bg-card rounded-xl border p-3 ${s.recommended ? "border-primary/30" : "border-border"} relative`}>
              {s.recommended && (
                <div className="absolute -top-2 right-3 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">추천</div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Truck className="w-3 h-3" />{s.distance} · {s.time}
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground">{s.unitPrice.toLocaleString()}<span className="text-[10px] font-normal text-muted-foreground">원</span></span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-muted-foreground">예상 매출</p>
                  <p className="font-semibold text-foreground">{s.totalRevenue.toLocaleString()}원</p>
                </div>
                <div>
                  <p className="text-muted-foreground">예상 물류비</p>
                  <p className="font-semibold text-foreground">-{s.logistics.toLocaleString()}원</p>
                </div>
                <div>
                  <p className="text-muted-foreground">예상 순매출</p>
                  <p className="font-bold text-primary">{s.netRevenue.toLocaleString()}원</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{s.reason}</p>
            </div>
          ))}
        </div>

        {/* 비용 기준 안내 */}
        <div className="bg-secondary/50 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-0.5">비용 산출 기준</p>
            <p>물류비는 운송 거리 기준 예상치이며 실제와 다를 수 있습니다. 예상 단가는 최근 경매 데이터 기반 추정입니다.</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SalesChannelPage;
