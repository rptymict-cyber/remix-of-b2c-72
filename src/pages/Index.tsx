import { useState } from "react";
import { ChevronRight, CloudSun, BrainCircuit, ArrowUpRight, BarChart3, Store, Sprout, Plus, Clock, Droplets, Wind, Thermometer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { findCrop, findMarket, seedPrice, CROPS } from "@/data/catalog";
import CropSheet from "@/components/sheets/CropSheet";
import MarketSheet from "@/components/sheets/MarketSheet";

const HomePage = () => {
  const navigate = useNavigate();
  const { cropId, variety, marketId, profile, setCrop } = useApp();
  const [cropOpen, setCropOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  const crop = findCrop(cropId);
  const market = findMarket(marketId);
  const price = seedPrice(cropId, marketId, variety);
  const myCropList = profile.myCrops.map((id) => findCrop(id));
  const suggestionList = CROPS.filter((c) => !profile.myCrops.includes(c.id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="농산물 시세 예측" />

      <main className="px-4 pt-5 safe-bottom space-y-5">
        {/* 운영 컨텍스트 카드 */}
        <section className="bg-[#2d5a3d] rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white/60 tracking-wide">{profile.name} 농부님 · 재배 기준 지역</p>
              <p className="text-[22px] font-bold mt-1 leading-tight">{profile.region}</p>
              <p className="text-[11px] text-white/60 mt-1.5">오늘 시세 및 예측의 기준 지역입니다</p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 ml-4">
              <CloudSun className="w-8 h-8 text-white/80 mb-1" />
              <p className="text-[28px] font-bold leading-none">18°C</p>
              <p className="text-[11px] text-white/60 mt-1">맑음</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-medium text-white/90 whitespace-nowrap flex-shrink-0">
              <Thermometer className="w-3 h-3" /> 향후 10일 기상 반영 중
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-medium text-white/90 whitespace-nowrap flex-shrink-0">
              <Droplets className="w-3 h-3" /> 3일 후 강수 예보
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f59e0b]/20 text-[10px] font-medium text-[#fbbf24] whitespace-nowrap flex-shrink-0">
              <Wind className="w-3 h-3" /> 출하 영향 주의
            </span>
          </div>
        </section>

        {/* 내 작물 선택 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-foreground">내 작물</h2>
            <button onClick={() => setCropOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary text-primary text-xs font-medium">
              <Plus className="w-3.5 h-3.5" />
              작물 추가
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center">
            {myCropList.map((c) => {
              const sel = c.id === cropId;
              return sel ? (
                <button
                  key={c.id}
                  onClick={() => setCropOpen(true)}
                  className="flex-shrink-0 flex items-center gap-2 pl-2.5 pr-4 py-2 rounded-full bg-[#2d5a3d] text-white text-sm font-semibold"
                >
                  <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-base">{c.emoji}</span>
                  {c.name}
                </button>
              ) : (
                <button
                  key={c.id}
                  onClick={() => setCrop(c.id, c.varieties[0])}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary text-foreground text-sm"
                >
                  <span>{c.emoji}</span>{c.name}
                </button>
              );
            })}
            {myCropList.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">위 + 버튼을 눌러 작물을 추가하세요</p>
            )}
          </div>
        </section>

        {/* 현재 시세 카드 */}
        <section
          onClick={() => navigate("/market")}
          className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground tracking-wide">
                  {crop.emoji} {crop.name} · {variety} · {market.name}
                </p>
                <div className="flex items-baseline gap-1.5 mt-2.5">
                  <span className="text-[34px] font-extrabold text-foreground leading-none tracking-tight">{price.toLocaleString()}</span>
                  <span className="text-[13px] font-medium text-muted-foreground">원/{crop.defaultUnitKg}kg</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 pt-0.5 flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                <div className="flex items-center gap-1 mt-1 px-2.5 py-1 rounded-lg bg-[hsl(0_72%_50%/0.07)]">
                  <ArrowUpRight className="w-3.5 h-3.5 price-up" />
                  <span className="text-[13px] font-bold price-up">+2.7%</span>
                </div>
                <span className="text-[10px] text-muted-foreground">전일 대비</span>
              </div>
            </div>
          </div>
          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-background rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground leading-tight">전주</p>
                <p className="text-[15px] font-bold price-up mt-1 leading-tight">+8.1%</p>
              </div>
              <div className="bg-background rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground leading-tight">전년</p>
                <p className="text-[15px] font-bold price-down mt-1 leading-tight">-4.4%</p>
              </div>
              <div className="bg-background rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground leading-tight">거래량</p>
                <p className="text-[15px] font-bold text-foreground mt-1 leading-tight">1,240t</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border/60 px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <Clock className="w-3 h-3" />
              <span>2026.05.07 14:32 업데이트</span>
            </div>
            <span className="text-[10px] text-primary font-medium">시세 상세 →</span>
          </div>
        </section>

        {/* AI 예측 카드 */}
        <section
          onClick={() => navigate("/prediction")}
          className="prediction-hero cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-white/80" />
                <span className="text-xs font-medium text-white/80">AI 예측 · {crop.emoji} {crop.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-xl font-bold">5월 12일 (화) 출하 추천</p>
            <p className="text-sm text-white/70 mt-1">
              예상 추가 수익 <span className="text-white font-semibold">+8.1%</span>
            </p>
            <div className="mt-3 bg-white/15 rounded-md px-3 py-2">
              <p className="text-xs text-white/80 leading-relaxed">
                향후 10일간 상승 후 조정 예상 — 5월 12일 출하가 가장 유리합니다
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-white/50">기상 변화·수급 동향 반영</span>
              <span className="text-[10px] text-white font-semibold">예측 상세 →</span>
            </div>
          </div>
        </section>

        {/* 빠른 진입 4개 */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2.5">빠른 진입</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BarChart3, title: "실시간 시세", desc: "전국 도매시장 시세", color: "bg-primary/10", iconColor: "text-primary", route: "/market" },
              { icon: BrainCircuit, title: "AI 가격 예측", desc: "10일 예측 · 출하 추천", color: "bg-accent/10", iconColor: "text-accent", route: "/prediction" },
              { icon: Store, title: "판매처 비교", desc: "물류비 포함 순이익 1위", color: "bg-warning/10", iconColor: "text-warning", route: "/sales" },
              { icon: Sprout, title: "내 작물", desc: "작물 관리 · 추천", color: "bg-success/10", iconColor: "text-success", route: "/crop" },
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.route)}
                className="bg-card rounded-2xl border border-border p-4 text-left shadow-[var(--shadow-sm)] active:scale-[0.98] transition-transform relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-full ${item.color} flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
      <CropSheet open={cropOpen} onOpenChange={setCropOpen} />
      <MarketSheet open={marketOpen} onOpenChange={setMarketOpen} />
    </div>
  );
};

export default HomePage;
