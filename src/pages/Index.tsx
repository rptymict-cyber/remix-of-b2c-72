import { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  BrainCircuit,
  BarChart3,
  Store,
  Sprout,
  Plus,
  MapPin,
  Search,
  Clock,
  History,
  Radio,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { findCrop, findMarket, seedPrice, seedPriceHistory, FEATURED_CROPS } from "@/data/catalog";
import CropSheet from "@/components/sheets/CropSheet";
import MarketSheet from "@/components/sheets/MarketSheet";
import UnitSheet from "@/components/sheets/UnitSheet";
import PriceSparkline from "@/components/PriceSparkline";

const HomePage = () => {
  const navigate = useNavigate();
  const { cropId, variety, marketId, profile, unitKg, setCrop, setUnitKg, ensureSelectedCrop } = useApp();

  useEffect(() => {
    ensureSelectedCrop();
  }, [ensureSelectedCrop, profile.myCrops]);

  const [cropOpen, setCropOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  const crop = findCrop(cropId);
  const market = findMarket(marketId);
  const basePrice = seedPrice(cropId, marketId, variety); // 기준 단량(crop.defaultUnitKg) 가격
  // 환산: basePrice는 crop.defaultUnitKg 기준 → 선택 unitKg로 비례 환산
  const displayPrice = Math.round((basePrice * (unitKg / crop.defaultUnitKg)) / 100) * 100;
  const kgPrice = Math.round(basePrice / crop.defaultUnitKg);
  const history = useMemo(() => seedPriceHistory(cropId, marketId, variety, 7), [cropId, marketId, variety]);
  const trendPct = ((history[history.length - 1] - history[0]) / history[0]) * 100;

  const myCropList = profile.myCrops.map((id) => findCrop(id));
  const hasCrops = myCropList.length > 0;

  return (
    <div className="h-full bg-background">
      <AppHeader title="농산물 시세" />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+1rem)] safe-bottom space-y-4">
        {/* 지역·날씨 슬림 카드 */}
        <section className="bg-card rounded-2xl border border-border px-4 py-3 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-foreground truncate">{profile.region}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">시세 기준 지역 · 14:32 업데이트</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              <span className="text-[15px] font-bold text-foreground">18°</span>
              <span className="text-[11px] text-muted-foreground">맑음</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            <p className="text-[10px] text-muted-foreground">향후 10일 기상 반영 중</p>
          </div>
        </section>

        {/* 내 작물 칩 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-foreground">내 작물</h2>
            {hasCrops && (
              <button
                onClick={() => navigate("/crop/add")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-muted-foreground text-[11px] font-medium hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-3 h-3" />
                작물 추가
              </button>
            )}
          </div>
          {hasCrops ? (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center -mx-4 px-4">
              {myCropList.map((c) => {
                const sel = c.id === cropId;
                return (
                  <button
                    key={c.id}
                    onClick={() => (sel ? setCropOpen(true) : setCrop(c.id, c.varieties[0]))}
                    className={`flex-shrink-0 min-h-11 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                      sel
                        ? "bg-[#2d5a3d] text-white shadow-[var(--shadow-sm)]"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    <span className="text-base leading-none">{c.emoji}</span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => navigate("/crop/add")}
              className="w-full min-h-12 flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> 작물 추가
            </button>
          )}
        </section>

        {/* 오늘 시세 Hero */}
        {hasCrops && (
          <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <button
                onClick={() => setMarketOpen(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground tracking-wide"
              >
                {crop.emoji} {crop.name} · {variety} · {market.name}
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="flex items-end justify-between mt-2.5">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[32px] font-extrabold text-foreground leading-none tracking-tight">
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-[13px] font-medium text-muted-foreground">원/{unitKg}kg</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    환산가 {kgPrice.toLocaleString()}원 / kg
                  </p>
                </div>
                <button
                  onClick={() => setUnitOpen(true)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-foreground text-[12px] font-semibold"
                >
                  {unitKg}kg 기준
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 미니 그래프 */}
            <div className="px-3 pb-1 relative">
              <PriceSparkline data={history} width={360} height={70} className="w-full h-[70px]" />
              <div className="absolute right-5 top-0 bg-[#2d5a3d] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                현재 {displayPrice.toLocaleString()}원
              </div>
            </div>

            {/* 변동 지표 */}
            <div className="px-5 pt-2 pb-3">
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-background rounded-lg px-2 py-2">
                  <p className="text-[10px] text-muted-foreground leading-tight">전일</p>
                  <p className="text-[13px] font-bold price-up mt-0.5 leading-tight">+2.7%</p>
                </div>
                <div className="bg-background rounded-lg px-2 py-2">
                  <p className="text-[10px] text-muted-foreground leading-tight">전주</p>
                  <p className="text-[13px] font-bold price-up mt-0.5 leading-tight">+8.1%</p>
                </div>
                <div className="bg-background rounded-lg px-2 py-2">
                  <p className="text-[10px] text-muted-foreground leading-tight">전년</p>
                  <p className="text-[13px] font-bold price-down mt-0.5 leading-tight">-4.4%</p>
                </div>
                <div className="bg-background rounded-lg px-2 py-2">
                  <p className="text-[10px] text-muted-foreground leading-tight">거래량</p>
                  <p className="text-[13px] font-bold text-foreground mt-0.5 leading-tight">1,240t</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-border/60 grid grid-cols-2">
              <button
                onClick={() => navigate("/market")}
                className="min-h-12 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-primary border-r border-border/60"
              >
                <Radio className="w-3.5 h-3.5" />
                실시간 경락가 조회
              </button>
              <button
                onClick={() => navigate("/market")}
                className="min-h-12 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-foreground"
              >
                시세 상세 보기
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}

        {/* 빠른 시세 조회 */}
        <section>
          <div className="mb-2.5">
            <h2 className="text-sm font-semibold text-foreground">빠른 시세 조회</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              도매시장·품목·품종을 선택해 경락가를 바로 확인하세요.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Radio, label: "실시간 경락가 조회", route: "/market" },
              { icon: Clock, label: "이전 가격 조회", route: "/market" },
              { icon: Search, label: "품목 검색", route: "/market" },
              { icon: History, label: "최근 조회", route: "/market" },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => navigate(b.route)}
                className="min-h-14 bg-card rounded-2xl border border-border px-3.5 py-3 flex items-center gap-2.5 shadow-[var(--shadow-sm)] active:scale-[0.98] transition-transform"
              >
                <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4 text-primary" />
                </span>
                <span className="text-[13px] font-semibold text-foreground text-left leading-tight">
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 오늘 주목 작물 */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2.5">오늘 주목 작물</h2>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {FEATURED_CROPS.map((f) => {
              const fc = findCrop(f.cropId);
              const fm = findMarket(f.marketId);
              const hist = seedPriceHistory(f.cropId, f.marketId, f.variety, 7);
              const up = f.priceChangePct > 0;
              const badgeColor =
                f.badge === "거래량 급증"
                  ? "bg-warning/15 text-warning"
                  : f.badge === "가격 상승"
                    ? "bg-[hsl(0_72%_50%/0.1)] price-up"
                    : "bg-[hsl(215_80%_55%/0.1)] price-down";
              return (
                <button
                  key={f.cropId}
                  onClick={() => navigate("/market")}
                  className="flex-shrink-0 w-[220px] bg-card rounded-2xl border border-border p-3.5 shadow-[var(--shadow-sm)] text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                      {f.badge}
                    </span>
                    {up ? (
                      <TrendingUp className="w-3.5 h-3.5 price-up" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 price-down" />
                    )}
                  </div>
                  <p className="text-[14px] font-bold text-foreground flex items-center gap-1">
                    <span className="text-base">{fc.emoji}</span> {fc.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fm.name}</p>
                  <p className="text-[16px] font-extrabold text-foreground mt-2 leading-none">
                    {f.price.toLocaleString()}
                    <span className="text-[11px] font-medium text-muted-foreground ml-1">원/{f.unitKg}kg</span>
                  </p>
                  <div className="mt-1.5">
                    <PriceSparkline data={hist} width={180} height={36} showMarker={false} className="w-full h-9" />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px]">
                    <span className={`font-bold ${up ? "price-up" : "price-down"}`}>
                      가격 {up ? "+" : ""}
                      {f.priceChangePct}%
                    </span>
                    <span className="text-muted-foreground">
                      거래량 {f.volumeChangePct > 0 ? "+" : ""}
                      {f.volumeChangePct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* AI 출하 타이밍 추천 (우선순위 하향) */}
        <section
          onClick={() => navigate("/prediction")}
          className="prediction-hero cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-white/80" />
                <span className="text-xs font-medium text-white/80">AI 출하 타이밍 추천</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-lg font-bold">5월 12일 (화) 출하가 가장 유리합니다</p>
            <p className="text-sm text-white/70 mt-1">
              예상 추가 수익 <span className="text-white font-semibold">+8.1%</span>
            </p>
            <div className="mt-3 bg-white/15 rounded-md px-3 py-2">
              <p className="text-xs text-white/80 leading-relaxed">
                향후 10일간 상승 후 조정 예상 — 출하 시기 조정으로 추가 수익 확보 가능
              </p>
            </div>
            <div className="flex items-center justify-end mt-3">
              <span className="text-[11px] text-white font-semibold">예측 상세 보기 →</span>
            </div>
          </div>
        </section>

        {/* 주요 서비스 */}
        <section className="pb-2">
          <h2 className="text-sm font-semibold text-foreground mb-2.5">주요 서비스</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BarChart3, title: "실시간 경락가 조회", desc: "전국 도매시장 시세", color: "bg-primary/10", iconColor: "text-primary", route: "/market" },
              { icon: BrainCircuit, title: "AI 출하 예측", desc: "10일 예측 · 출하 추천", color: "bg-accent/10", iconColor: "text-accent", route: "/prediction" },
              { icon: Store, title: "판매처 비교", desc: "물류비 포함 순이익 1위", color: "bg-warning/10", iconColor: "text-warning", route: "/sales" },
              { icon: Sprout, title: "내 작물 관리", desc: "작물 등록 · 추천", color: "bg-success/10", iconColor: "text-success", route: "/crop" },
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.route)}
                className="bg-card rounded-2xl border border-border p-4 text-left shadow-[var(--shadow-sm)] active:scale-[0.98] transition-transform"
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
      <UnitSheet
        open={unitOpen}
        onOpenChange={setUnitOpen}
        cropId={cropId}
        variety={variety}
        selectedKg={unitKg}
        onConfirm={(kg) => setUnitKg(kg)}
      />
    </div>
  );
};

export default HomePage;
