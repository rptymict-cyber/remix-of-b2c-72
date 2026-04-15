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
        <div className="flex flex-wrap gap-2.5">
          {[
            { label: "상추 · 청상추", icon: true },
            { label: "충북 충주", icon: true },
            { label: "38상자", icon: true },
            { label: "2kg 상자", icon: true },
          ].map((chip) => (
            <button key={chip.label} className="filter-chip">
              {chip.label}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
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

        {/* 위치 요약 - 지도 스타일 */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-border">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">출하 위치 비교</span>
          </div>
          <div className="relative bg-[#e8f4e8] h-52 overflow-hidden">
            {/* 지도 배경 패턴 */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              {/* 도로 그리드 */}
              <line x1="0" y1="60" x2="400" y2="60" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
              <line x1="0" y1="180" x2="400" y2="180" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
              <line x1="80" y1="0" x2="80" y2="220" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
              <line x1="195" y1="0" x2="195" y2="220" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
              <line x1="310" y1="0" x2="310" y2="220" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
              {/* 주요 도로 */}
              <path d="M50 200 Q120 140 195 110 Q270 80 350 30" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="none" opacity="0.2" />
              <path d="M30 80 Q100 100 195 110 Q290 120 380 160" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="none" opacity="0.2" />
              {/* 지형 영역 */}
              <circle cx="60" cy="40" r="25" fill="hsl(142 40% 60%)" opacity="0.15" />
              <circle cx="320" cy="180" r="30" fill="hsl(142 40% 60%)" opacity="0.12" />
              <circle cx="140" cy="170" r="20" fill="hsl(200 50% 60%)" opacity="0.1" />
            </svg>

            {/* 연결선 - 내 농장에서 각 시장으로 */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* 내 농장 → 대구북부 */}
              <line x1="195" y1="105" x2="300" y2="160" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
              {/* 내 농장 → 대전 오정 */}
              <line x1="195" y1="105" x2="130" y2="160" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4 3" opacity="0.35" />
              {/* 내 농장 → 안양 */}
              <line x1="195" y1="105" x2="230" y2="40" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4 3" opacity="0.35" />
              {/* 내 농장 → 서울 가락 */}
              <line x1="195" y1="105" x2="195" y2="30" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4 3" opacity="0.35" />
            </svg>

            {/* 내 농장 마커 (중앙) */}
            <div className="absolute left-1/2 top-[105px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
              <div className="relative">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 ring-[3px] ring-white">
                  <MapPin className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary" />
              </div>
              <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm border border-border/50">
                <p className="text-[10px] font-bold text-foreground leading-tight">내 농장</p>
                <p className="text-[9px] text-muted-foreground leading-tight">충북 충주시</p>
              </div>
            </div>

            {/* 대구북부 마커 (추천) */}
            <div className="absolute left-[75%] top-[160px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
              <div className="relative">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                  <Star className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="mt-1.5 bg-white/95 backdrop-blur-sm rounded-md px-2 py-0.5 shadow-sm border border-primary/20">
                <p className="text-[9px] font-bold text-primary leading-tight">대구북부</p>
                <p className="text-[8px] text-muted-foreground leading-tight">82km</p>
              </div>
            </div>

            {/* 대전 오정 마커 */}
            <div className="absolute left-[33%] top-[160px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
              <div className="w-6 h-6 bg-muted-foreground/60 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <div className="mt-1 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm">
                <p className="text-[9px] font-medium text-foreground leading-tight">대전 오정</p>
                <p className="text-[8px] text-muted-foreground leading-tight">48km</p>
              </div>
            </div>

            {/* 안양 마커 */}
            <div className="absolute left-[60%] top-[40px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
              <div className="w-6 h-6 bg-muted-foreground/60 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <div className="mt-1 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm">
                <p className="text-[9px] font-medium text-foreground leading-tight">안양</p>
                <p className="text-[8px] text-muted-foreground leading-tight">185km</p>
              </div>
            </div>

            {/* 서울 가락 마커 */}
            <div className="absolute left-[50%] top-[28px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
              <div className="w-6 h-6 bg-muted-foreground/60 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <div className="mt-1 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm">
                <p className="text-[9px] font-medium text-foreground leading-tight">서울 가락</p>
                <p className="text-[8px] text-muted-foreground leading-tight">210km</p>
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
