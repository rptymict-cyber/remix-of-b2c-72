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
  TrendingUp,
  Package,
  Gavel,
  Bookmark,
  TrendingDown,
  RefreshCw,
  Sparkles,
  AlertTriangle,

} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { findCrop, findMarket, seedPrice, seedPriceHistory, FEATURED_CROPS } from "@/data/catalog";
import CropSheet from "@/components/sheets/CropSheet";
import MarketSheet from "@/components/sheets/MarketSheet";
import PriceModeSheet, { PriceMode, computePriceByMode } from "@/components/sheets/PriceModeSheet";
import PriceSparkline from "@/components/PriceSparkline";

type UpdateStatus = "normal" | "loading" | "delayed" | "error";

const STATUS_STYLES: Record<UpdateStatus, { bg: string; text: string; icon: string }> = {
  normal: { bg: "bg-[#EAF7EA]", text: "text-[#1A3A1F]", icon: "text-[#1A3A1F]" },
  loading: { bg: "bg-[#EAF0F7]", text: "text-[#1F3A5A]", icon: "text-[#1F3A5A]" },
  delayed: { bg: "bg-[#FBEFDC]", text: "text-[#7A4A12]", icon: "text-[#7A4A12]" },
  error: { bg: "bg-[#FBE3E3]", text: "text-[#7A1F1F]", icon: "text-[#7A1F1F]" },
};

const HomePage = () => {
  const navigate = useNavigate();
  const { cropId, variety, marketId, profile, setCrop, ensureSelectedCrop } = useApp();

  useEffect(() => {
    ensureSelectedCrop();
  }, [ensureSelectedCrop, profile.myCrops]);

  const [cropOpen, setCropOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [priceModeOpen, setPriceModeOpen] = useState(false);
  const [priceMode, setPriceMode] = useState<PriceMode>("per20kg");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("normal");

  const crop = findCrop(cropId);
  const market = findMarket(marketId);
  const basePrice = seedPrice(cropId, marketId, variety);
  const { price: displayPrice, unitLabel, unitKg } = computePriceByMode(priceMode, basePrice, crop.defaultUnitKg);
  const kgPrice = Math.round(basePrice / crop.defaultUnitKg);

  // 보조 정보
  const subInfo =
    priceMode === "perKg"
      ? `실거래가 ${basePrice.toLocaleString()}원 / ${crop.defaultUnitKg}kg`
      : priceMode === "actual" || priceMode === "cropDefault"
        ? `환산가 ${kgPrice.toLocaleString()}원 / kg`
        : `실거래가 ${basePrice.toLocaleString()}원 / ${crop.defaultUnitKg}kg`;

  const history = useMemo(() => seedPriceHistory(cropId, marketId, variety, 7), [cropId, marketId, variety]);

  const myCropList = profile.myCrops.map((id) => findCrop(id));
  const hasCrops = myCropList.length > 0;

  const onRefresh = () => {
    setUpdateStatus("loading");
    window.setTimeout(() => setUpdateStatus("normal"), 1200);
  };

  const statusText: Record<UpdateStatus, string> = {
    normal: `${profile.region} 기준 · 오늘 14:30 업데이트`,
    loading: "시세 데이터를 업데이트 중입니다...",
    delayed: "데이터 업데이트가 지연되고 있습니다",
    error: "새로고침 실패. 다시 시도해 주세요",
  };

  const ss = STATUS_STYLES[updateStatus];

  // AI 인사이트 mock 계산 (50상자 기준)
  const aiUpliftPct = 6.3;
  const aiExtraPerBox = Math.round((basePrice * aiUpliftPct) / 100);
  const aiExtraTotal = Math.round((aiExtraPerBox * 50) / 1000) * 1000;

  return (
    <div className="h-full bg-background">
      <AppHeader title="농산물 시세" />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+0.75rem)] safe-bottom space-y-4">
        {/* 업데이트 상태 바 */}
        <section
          className={`${ss.bg} rounded-[14px] h-11 px-[14px] flex items-center justify-between transition-colors`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {updateStatus === "error" || updateStatus === "delayed" ? (
              <AlertTriangle className={`w-4 h-4 shrink-0 ${ss.icon}`} />
            ) : (
              <MapPin className={`w-4 h-4 shrink-0 ${ss.icon}`} />
            )}
            <p className={`text-[12.5px] font-semibold truncate ${ss.text}`}>{statusText[updateStatus]}</p>
          </div>
          <button
            onClick={onRefresh}
            aria-label="새로고침"
            disabled={updateStatus === "loading"}
            className={`shrink-0 ml-2 ${ss.icon}`}
          >
            <RefreshCw className={`w-4 h-4 ${updateStatus === "loading" ? "animate-spin" : ""}`} />
          </button>
        </section>

        {/* 통합 검색창 */}
        <button
          onClick={() => navigate("/search")}
          className="w-full h-12 px-3.5 rounded-2xl bg-white border border-border flex items-center gap-2 text-left shadow-[var(--shadow-sm)]"
          aria-label="검색"
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-[13.5px] text-muted-foreground">품목, 품종, 시장 검색</span>
        </button>


        {/* 빠른 시세 조회 */}
        <section>
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-foreground">빠른 시세 조회</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">자주 쓰는 시세 조회 기능을 바로 확인하세요.</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: TrendingUp, label: "가격 동향", route: "/market?tab=auction" },
              { icon: Package, label: "품목별 시세", route: "/market?tab=variety" },
              { icon: Gavel, label: "경매 일정", route: "/market?tab=auction" },
              { icon: Bookmark, label: "관심 작물", route: "/search" },
            ].map((m) => (
              <button
                key={m.label}
                onClick={() => navigate(m.route)}
                className="bg-white rounded-[16px] border border-[#EFEFEF] shadow-[var(--shadow-sm)] py-3.5 flex flex-col items-center gap-2 active:scale-[0.97] transition-transform"
              >
                <m.icon className="w-7 h-7 text-[#1A3A1F]" strokeWidth={1.8} />
                <span className="text-[12.5px] font-semibold text-foreground text-center leading-tight whitespace-nowrap">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </section>


        {/* 내 작물 칩 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-foreground">내 작물</h2>
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
                        ? "bg-[#1A3A1F] text-white shadow-[var(--shadow-sm)]"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    <span className="text-base leading-none">{c.emoji}</span>
                    {c.name}
                  </button>
                );
              })}
              <button
                onClick={() => navigate("/crop/add")}
                className="flex-shrink-0 min-h-11 flex items-center gap-1 px-3.5 py-2 rounded-full border border-dashed border-primary/50 text-primary text-sm font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                작물 추가
              </button>
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
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => setMarketOpen(true)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground text-left"
                >
                  <span className="truncate">
                    {crop.emoji} {crop.name} · {variety} · {market.name}
                  </span>
                  <ChevronDown className="w-3 h-3 shrink-0" />
                </button>
                <button
                  onClick={() => setPriceModeOpen(true)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-foreground text-[12px] font-semibold"
                >
                  가격 기준 {unitLabel}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] font-extrabold text-foreground leading-none tracking-tight">
                    {displayPrice.toLocaleString()}
                  </span>
                  <span className="text-[14px] font-semibold text-muted-foreground">원 / {unitLabel}</span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1.5">{subInfo}</p>
              </div>
            </div>

            {/* 미니 그래프 */}
            <div className="px-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-muted-foreground">최근 7일 시세 흐름</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(0_72%_50%/0.08)] price-up">
                  최근 하락 후 반등
                </span>
              </div>
              <div className="relative pt-4">
                <PriceSparkline data={history} width={340} height={70} className="w-full h-[70px]" />
                <div className="absolute right-0 -top-0.5 bg-[#1A3A1F] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  현재 {displayPrice.toLocaleString()}원
                </div>
              </div>
              <div className="flex justify-between mt-1 text-[9.5px] text-muted-foreground">
                <span>5/6</span><span>5/7</span><span>5/8</span><span>5/9</span><span>5/10</span><span>5/11</span><span className="font-bold text-foreground">5/12 오늘</span>
              </div>
            </div>

            {/* KPI */}
            <div className="px-5 pt-3">
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

            {/* AI 출하 인사이트 (Hero 내부 통합) */}
            <div className="px-5 pt-3">
              <button
                onClick={() => navigate("/prediction")}
                className="w-full bg-[#EAF7EA] rounded-[14px] px-3.5 py-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
              >
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#1A3A1F]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-bold text-[#1A3A1F]">AI 출하 인사이트</p>
                  <p className="text-[12.5px] text-foreground mt-0.5 leading-snug">
                    5월 24일 출하 시 현재보다 <span className="price-up font-extrabold">+{aiUpliftPct}%</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    50상자 기준 예상 추가 수익{" "}
                    <span className="text-[#1A3A1F] font-extrabold">+{aiExtraTotal.toLocaleString()}원</span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#1A3A1F]/60 shrink-0" />
              </button>
            </div>

            {/* CTA */}
            <div className="px-5 py-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/market")}
                className="min-h-12 rounded-2xl border-2 border-primary bg-white text-primary text-[13px] font-bold"
              >
                이 작물 경락가 조회
              </button>
              <button
                onClick={() => navigate("/prediction")}
                className="min-h-12 rounded-2xl bg-[#1A3A1F] text-white text-[13px] font-bold"
              >
                AI 예측 보기
              </button>
            </div>
          </section>
        )}

        {/* 오늘 주목 작물 - compact 세로 리스트 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">오늘 주목 작물</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                거래량이나 가격 변동이 큰 품목이에요.
              </p>
            </div>
            <button
              onClick={() => navigate("/market")}
              className="text-[11px] font-semibold text-primary flex items-center gap-0.5 shrink-0"
            >
              더보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {FEATURED_CROPS.map((f) => {
              const fc = findCrop(f.cropId);
              const fm = findMarket(f.marketId);
              const hist = seedPriceHistory(f.cropId, f.marketId, f.variety, 7);
              const up = f.priceChangePct > 0;
              const badgeColor =
                f.badge === "거래량 급증"
                  ? "bg-[#FBEFDC] text-[#7A4A12]"
                  : f.badge === "가격 상승"
                    ? "bg-[hsl(0_72%_50%/0.12)] price-up"
                    : "bg-[hsl(215_80%_55%/0.12)] price-down";
              return (
                <button
                  key={f.cropId}
                  onClick={() => navigate("/market")}
                  className="w-full bg-card rounded-[14px] border border-[#E8E8E8] shadow-[var(--shadow-sm)] px-3 py-2.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform min-h-[72px]"
                >
                  <div className="w-11 h-11 rounded-full bg-background flex items-center justify-center text-2xl shrink-0">
                    {fc.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[13px] font-bold text-foreground truncate">{fc.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeColor}`}>
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-muted-foreground truncate leading-tight">{fm.name}</p>
                    <p className="text-[14px] font-extrabold text-foreground mt-0.5 leading-none">
                      {f.price.toLocaleString()}
                      <span className="text-[10.5px] font-medium text-muted-foreground ml-0.5">
                        원/{f.unitKg}kg
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-[12px] font-extrabold ${up ? "price-up" : "price-down"}`}>
                      {up ? "+" : ""}
                      {f.priceChangePct}%
                    </span>
                    <PriceSparkline data={hist} width={64} height={28} showMarker={false} className="w-16 h-7" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>



      </main>

      <BottomNav />
      <CropSheet open={cropOpen} onOpenChange={setCropOpen} />
      <MarketSheet open={marketOpen} onOpenChange={setMarketOpen} />
      <PriceModeSheet
        open={priceModeOpen}
        onOpenChange={setPriceModeOpen}
        cropId={cropId}
        basePrice={basePrice}
        defaultUnitKg={crop.defaultUnitKg}
        selectedMode={priceMode}
        onApply={setPriceMode}
      />
    </div>
  );
};

export default HomePage;
