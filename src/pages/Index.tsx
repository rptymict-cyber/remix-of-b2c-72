import { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MapPin,
  Search,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import type { UserType } from "@/store/appStore";
import { findCrop, findMarket, seedPrice, seedPriceHistory, FEATURED_CROPS } from "@/data/catalog";
import CropSheet from "@/components/sheets/CropSheet";
import MarketSheet from "@/components/sheets/MarketSheet";
import PriceModeSheet, { PriceMode, computePriceByMode } from "@/components/sheets/PriceModeSheet";
import PriceSparkline from "@/components/PriceSparkline";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type UpdateStatus = "normal" | "loading" | "delayed" | "error";

const STATUS_STYLES: Record<UpdateStatus, { bg: string; text: string; icon: string }> = {
  normal: { bg: "bg-[#EAF7EA]", text: "text-[#1A3A1F]", icon: "text-[#1A3A1F]" },
  loading: { bg: "bg-[#EAF0F7]", text: "text-[#1F3A5A]", icon: "text-[#1F3A5A]" },
  delayed: { bg: "bg-[#FBEFDC]", text: "text-[#7A4A12]", icon: "text-[#7A4A12]" },
  error: { bg: "bg-[#FBE3E3]", text: "text-[#7A1F1F]", icon: "text-[#7A1F1F]" },
};

const USER_TYPE_OPTIONS: { id: NonNullable<UserType>; icon: string; title: string; desc: string; tags: string[] }[] = [
  { id: "farmer", icon: "👨‍🌾", title: "농민 · 농업법인", desc: "내 작물을 직접 재배하고 판매해요", tags: ["출하 시점 추천", "내 작물 시세", "수익 시뮬레이션"] },
  { id: "wholesaler", icon: "🏪", title: "도매상 · 중도매인", desc: "시장에서 농산물을 사고 팔아요", tags: ["반입량·낙찰가", "산지별 시세", "법인 비교"] },
  { id: "retailer", icon: "🛒", title: "소매상 · 마트 바이어", desc: "농산물을 매입해서 소비자에게 판매해요", tags: ["도소매 가격차", "매입 적정가", "가격 경보"] },
  { id: "enterprise", icon: "🏢", title: "식품기업 · 유통업체", desc: "대량 조달 전략과 수급 분석이 필요해요", tags: ["공급량 동향", "산지 분석", "중기 예측"] },
];

const TYPE_META: Record<NonNullable<UserType> | "default", { dot: string; color: string; name: string; desc: string }> = {
  farmer: { dot: "bg-primary", color: "text-primary", name: "👨‍🌾 농민 모드", desc: "출하 시점·내 작물 시세 중심" },
  wholesaler: { dot: "bg-[#1A3060]", color: "text-[#1A3060]", name: "🏪 도매상 모드", desc: "반입량·낙찰가·법인 중심" },
  retailer: { dot: "bg-[#C45000]", color: "text-[#C45000]", name: "🛒 소매상 모드", desc: "매입 적정가·마진 중심" },
  enterprise: { dot: "bg-[#6B2D8B]", color: "text-[#6B2D8B]", name: "🏢 기업 모드", desc: "수급 동향·중기 예측 중심" },
  default: { dot: "bg-primary", color: "text-primary", name: "👨‍🌾 농민 모드", desc: "출하 시점·내 작물 시세 중심" },
};

const HomePage = () => {
  const navigate = useNavigate();
  const { cropId, variety, marketId, profile, setCrop, setProfile, ensureSelectedCrop } = useApp();

  useEffect(() => {
    ensureSelectedCrop();
  }, [ensureSelectedCrop, profile.myCrops]);

  const [cropOpen, setCropOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [priceModeOpen, setPriceModeOpen] = useState(false);
  const [priceMode, setPriceMode] = useState<PriceMode>("per20kg");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("normal");
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [pendingType, setPendingType] = useState<NonNullable<UserType>>("farmer");

  const userType = (profile.userType ?? null) as UserType;
  const typeMeta = TYPE_META[userType ?? "default"];

  const crop = findCrop(cropId);
  const market = findMarket(marketId);
  const basePrice = seedPrice(cropId, marketId, variety);
  const { price: displayPrice, unitLabel, unitKg } = computePriceByMode(priceMode, basePrice, crop.defaultUnitKg);
  const kgPrice = Math.round(basePrice / crop.defaultUnitKg);

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

  const aiUpliftPct = 6.3;
  const aiExtraPerBox = Math.round((basePrice * aiUpliftPct) / 100);
  const aiExtraTotal = Math.round((aiExtraPerBox * 50) / 1000) * 1000;

  const openTypeSheet = () => {
    setPendingType((userType ?? "farmer") as NonNullable<UserType>);
    setTypeSheetOpen(true);
  };
  const applyType = () => {
    setProfile({ userType: pendingType });
    setTypeSheetOpen(false);
  };

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

        {/* 유형 배지 */}
        <div className="flex items-center gap-1.5 pt-1.5 pb-0.5">
          <span className={`w-[7px] h-[7px] rounded-full ${typeMeta.dot}`} />
          <span className={`text-[11px] font-bold ${typeMeta.color}`}>{typeMeta.name}</span>
          <span className="text-[10px] text-muted-foreground">{typeMeta.desc}</span>
          <button
            onClick={openTypeSheet}
            className="ml-auto text-[10px] font-semibold text-primary underline"
          >
            변경
          </button>
        </div>

        {/* 통합 검색창 */}
        <button
          onClick={() => navigate("/search")}
          className="w-full h-12 px-3.5 rounded-2xl bg-white border border-border flex items-center gap-2 text-left shadow-[var(--shadow-sm)]"
          aria-label="검색"
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-[13.5px] text-muted-foreground">품목, 품종, 시장 검색</span>
        </button>

        {/* ============ FARMER / NULL ============ */}
        {(userType === "farmer" || userType === null || userType === undefined) && (
          <>
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

            {/* 오늘 급변 작물 */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">오늘 급변 작물</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    가격이나 거래량 변동이 큰 품목이에요.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/market")}
                  className="text-[11px] font-semibold text-primary flex items-center gap-0.5 shrink-0"
                >
                  전체 보기 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {FEATURED_CROPS.map((f) => {
                  const fc = findCrop(f.cropId);
                  const fm = findMarket(f.marketId);
                  const baseHist = seedPriceHistory(f.cropId, f.marketId, f.variety, 7);
                  const up = f.priceChangePct > 0;
                  const sorted = [...baseHist].sort((a, b) => a - b);
                  const hist = up ? sorted : sorted.reverse();
                  const priceColor = up ? "price-up" : "price-down";
                  const volUp = f.volumeChangePct > 0;
                  const badgeColor =
                    f.badge === "거래량 급증"
                      ? "bg-[#FBEFDC] text-[#A65A12]"
                      : f.badge === "가격 상승"
                        ? "bg-[hsl(0_72%_50%/0.10)] price-up"
                        : "bg-[hsl(215_80%_55%/0.10)] price-down";
                  return (
                    <button
                      key={f.cropId}
                      onClick={() => navigate("/market")}
                      className="w-full bg-white rounded-[14px] border border-[#EFEFEF] shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-3 py-2.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform min-h-[76px]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 w-[42%]">
                        <div className="w-10 h-10 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl shrink-0">
                          {fc.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[13px] font-bold text-foreground truncate">{fc.name}</span>
                            <span className={`text-[9.5px] font-bold px-1.5 py-[1px] rounded-md whitespace-nowrap ${badgeColor}`}>
                              {f.badge}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground truncate leading-tight">
                            {fm.name} · {f.unitKg}kg
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <PriceSparkline data={hist} width={72} height={32} showMarker={false} className="w-[72px] h-8" />
                      </div>
                      <div className="shrink-0 flex flex-col items-end">
                        <span className="text-[14px] font-extrabold text-foreground leading-none">
                          {f.price.toLocaleString()}원
                        </span>
                        <span className={`text-[10.5px] font-bold mt-1 leading-none ${priceColor}`}>
                          가격 {up ? "+" : ""}{f.priceChangePct}%
                        </span>
                        <span className={`text-[10.5px] font-semibold mt-0.5 leading-none ${volUp ? "price-up" : "price-down"}`}>
                          거래량 {volUp ? "+" : ""}{f.volumeChangePct}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ============ WHOLESALER ============ */}
        {userType === "wholesaler" && <WholesalerContent navigate={navigate} />}

        {/* ============ RETAILER ============ */}
        {userType === "retailer" && <RetailerContent navigate={navigate} />}

        {/* ============ ENTERPRISE ============ */}
        {userType === "enterprise" && <EnterpriseContent navigate={navigate} />}
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

      {/* UserType 변경 시트 */}
      <Sheet open={typeSheetOpen} onOpenChange={setTypeSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-5 max-h-[88vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[17px] font-extrabold text-left">
              어떤 목적으로 시세를 보시나요?
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2.5">
            {USER_TYPE_OPTIONS.map((opt) => {
              const sel = pendingType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPendingType(opt.id)}
                  className={`w-full text-left rounded-2xl p-3.5 flex gap-3 transition ${
                    sel ? "border-2 border-primary bg-primary/5" : "border border-border bg-white"
                  }`}
                >
                  <span className="text-2xl shrink-0 leading-none">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground">{opt.title}</p>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {opt.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      sel ? "bg-primary text-white" : "bg-muted"
                    }`}
                  >
                    {sel && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={applyType}
            className="mt-5 w-full h-12 rounded-2xl bg-primary text-white text-[14px] font-bold"
          >
            적용하기
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HomePage;

/* ====================== WHOLESALER ====================== */
function WholesalerContent({ navigate }: { navigate: (p: string) => void }) {
  const bars = [
    { emoji: "🥬", name: "배추", vol: "1,280t", change: "▲ +31%", changeCls: "price-up", w: "95%", bar: "linear-gradient(90deg,#E03030,#FF8080)" },
    { emoji: "🧅", name: "양파", vol: "980t", change: "▲ +8%", changeCls: "price-up", w: "72%", bar: "linear-gradient(90deg,#1A3060,#4A7ABF)" },
    { emoji: "🍠", name: "고구마", vol: "640t", change: "→ 0%", changeCls: "text-muted-foreground", w: "48%", bar: "#A0B8D8" },
    { emoji: "🥕", name: "무", vol: "420t", change: "▼ -12%", changeCls: "price-down", w: "32%", bar: "#C0D0E8" },
  ];
  const corps = [
    { rank: "1위", name: "서울청과(주)", meta: "142건 · 276t · 점유율 32.8%", price: "38,900원", badge: "최고 낙찰", badgeCls: "price-up" },
    { rank: "2위", name: "중앙청과(주)", meta: "128건 · 250t · 점유율 29.7%", price: "37,700원", badge: "평균", badgeCls: "text-muted-foreground" },
    { rank: "3위", name: "동화청과(주)", meta: "87건 · 155t · 점유율 18.4%", price: "37,600원", badge: "최저 낙찰", badgeCls: "price-down" },
  ];
  return (
    <>
      {/* 3A. 오늘 시장 현황 */}
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[12px] font-semibold text-muted-foreground">📊 오늘 서울 가락시장 전체 현황</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-background rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">총 반입량</p>
              <p className="text-xl font-extrabold mt-0.5" style={{ color: "#1A3060" }}>4,820t</p>
            </div>
            <div className="bg-background rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">총 거래 건수</p>
              <p className="text-xl font-extrabold mt-0.5" style={{ color: "#1A3060" }}>1,240건</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            <div className="bg-background rounded-lg px-2 py-2">
              <p className="text-[10px] text-muted-foreground leading-tight">전일 대비</p>
              <p className="text-[13px] font-bold price-up mt-0.5 leading-tight">+12.3%</p>
            </div>
            <div className="bg-background rounded-lg px-2 py-2">
              <p className="text-[10px] text-muted-foreground leading-tight">평균 낙찰</p>
              <p className="text-[13px] font-bold text-foreground mt-0.5 leading-tight">38,000원</p>
            </div>
            <div className="bg-background rounded-lg px-2 py-2">
              <p className="text-[10px] text-muted-foreground leading-tight">최고가</p>
              <p className="text-[13px] font-bold price-up mt-0.5 leading-tight">42,000원</p>
            </div>
            <div className="bg-background rounded-lg px-2 py-2">
              <p className="text-[10px] text-muted-foreground leading-tight">최저가</p>
              <p className="text-[13px] font-bold price-down mt-0.5 leading-tight">35,000원</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 flex items-center justify-between gap-2 border-t border-border">
          <button
            onClick={() => navigate("/market")}
            className="h-10 px-3.5 rounded-full bg-secondary text-foreground text-[12px] font-bold"
          >
            📋 경매내역 전체
          </button>
          <button
            onClick={() => navigate("/market")}
            className="text-[12px] font-semibold text-primary flex items-center gap-0.5"
          >
            시세 상세 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* 3B. 품목별 반입량 */}
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] p-5">
        <p className="text-[12px] font-semibold text-muted-foreground mb-3">📦 품목별 오늘 반입량 현황</p>
        <div className="space-y-3">
          {bars.map((b) => (
            <div key={b.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-bold text-foreground">{b.emoji} {b.name}</span>
                <span className="text-[12px] font-semibold">
                  <span className="text-foreground">{b.vol}</span>{" "}
                  <span className={b.changeCls}>{b.change}</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full" style={{ width: b.w, background: b.bar }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3C. 법인별 낙찰가 */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-foreground">법인별 낙찰가 현황</h2>
          <button onClick={() => navigate("/market")} className="text-[11px] font-semibold text-primary flex items-center gap-0.5">
            전체 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {corps.map((c, i) => (
            <button
              key={c.rank}
              onClick={() => navigate("/market")}
              className={`w-full px-3 py-3 flex items-center gap-3 text-left active:bg-secondary/50 ${
                i < corps.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#EEF3FF] flex items-center justify-center shrink-0">
                <span className="text-[13px] font-extrabold" style={{ color: "#1A3060" }}>{c.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.meta}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-extrabold text-foreground">{c.price}</p>
                <p className={`text-[10px] font-bold mt-0.5 ${c.badgeCls}`}>{c.badge}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

/* ====================== RETAILER ====================== */
function RetailerContent({ navigate }: { navigate: (p: string) => void }) {
  const buys = [
    { emoji: "🥬", name: "배추", price: "13,500원", unit: "/10kg", whole: "도매 12,800원 기준", margin: "마진 +5.5% 확보 가능" },
    { emoji: "🧅", name: "양파", price: "19,500원", unit: "/15kg", whole: "도매 18,400원 기준", margin: "마진 +6.0% 확보 가능" },
  ];
  const rows = [
    { emoji: "🥬", name: "배추", badge: "매입 주의", sub: "도매 12,800원 / 적정 13,500원", change: "+5.5%", changeCls: "price-up", note: "마진 확보 가능", noteCls: "text-primary", up: true },
    { emoji: "🧅", name: "양파", badge: "", sub: "도매 18,400원 / 적정 19,500원", change: "+6.0%", changeCls: "price-up", note: "마진 확보 가능", noteCls: "text-primary", up: true },
    { emoji: "🥕", name: "무", badge: "", sub: "도매 9,600원 / 적정 10,200원", change: "▼ -0.8%", changeCls: "price-down", note: "가격 하락 중", noteCls: "text-muted-foreground", up: false },
  ];
  return (
    <>
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[12px] font-semibold text-muted-foreground mb-3">💡 오늘 매입 적정가 — 안양시장 기준</p>
          <div className="space-y-2">
            {buys.map((b) => (
              <div key={b.name} className="flex items-center justify-between rounded-xl p-3" style={{ background: "hsl(30 80% 97%)" }}>
                <span className="text-sm font-bold">{b.emoji} {b.name}</span>
                <div className="text-right">
                  <p className="text-[13px] font-extrabold" style={{ color: "#C45000" }}>
                    {b.price}<span className="text-[9px] text-muted-foreground font-semibold">{b.unit}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{b.whole}</p>
                  <p className="text-[10px] text-primary font-semibold mt-0.5">{b.margin}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: "hsl(0 80% 97%)" }}>
            <span className="text-destructive text-[11px] font-semibold">
              ⚠️ 배추 도매가 이번 주 +6.2% 급등 — 매입 단가 조정 검토 필요
            </span>
          </div>
        </div>
        <div className="px-5 py-3 flex items-center justify-between gap-2 border-t border-border">
          <button
            onClick={() => navigate("/notification-settings")}
            className="h-10 px-3.5 rounded-full bg-secondary text-foreground text-[12px] font-bold"
          >
            🔔 가격 경보 설정
          </button>
          <button
            onClick={() => navigate("/market")}
            className="text-[12px] font-semibold text-primary flex items-center gap-0.5"
          >
            시세 상세 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-foreground">취급 작물 시세 동향</h2>
          <button onClick={() => navigate("/market")} className="text-[11px] font-semibold text-primary flex items-center gap-0.5">
            전체 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {rows.map((r) => {
            const base = [10, 12, 11, 14, 13, 16, 18];
            const hist = r.up ? base : [...base].reverse();
            return (
              <button
                key={r.name}
                onClick={() => navigate("/market")}
                className="w-full bg-white rounded-[14px] border border-[#EFEFEF] shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-3 py-2.5 flex items-center gap-3 text-left min-h-[72px]"
              >
                <div className="flex items-center gap-2.5 min-w-0 w-[46%]">
                  <div className="w-10 h-10 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl shrink-0">
                    {r.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[13px] font-bold text-foreground">{r.name}</span>
                      {r.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-[1px] rounded-md bg-[hsl(0_72%_94%)] text-destructive">
                          {r.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-muted-foreground truncate">{r.sub}</p>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  <PriceSparkline data={hist} width={72} height={32} showMarker={false} className="w-[72px] h-8" />
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <span className={`text-[14px] font-extrabold ${r.changeCls}`}>{r.change}</span>
                  <span className={`text-[10px] font-semibold mt-1 ${r.noteCls}`}>{r.note}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ====================== ENTERPRISE ====================== */
function EnterpriseContent({ navigate }: { navigate: (p: string) => void }) {
  const supply = [
    { emoji: "🥬", name: "배추", status: "공급 정상", statusCls: "text-primary", trend: "반입 +12% · 가격 안정" },
    { emoji: "🧅", name: "양파", status: "공급 타이트", statusCls: "text-destructive", trend: "반입 -8% · 가격 ▲ +6.1%" },
    { emoji: "🍠", name: "고구마", status: "공급 정상", statusCls: "text-primary", trend: "반입 +2% · 소폭 상승" },
    { emoji: "🥕", name: "무", status: "공급 과잉", statusCls: "", trend: "반입 +24% · 가격 ▼ -5.2%", color: "#1E6FD9" },
  ];
  const forecasts = [
    { name: "배추", txt: "소폭 ↑", bg: "hsl(280 50% 96%)", color: "#6B2D8B" },
    { name: "양파", txt: "급등 ↑", bg: "hsl(0 72% 96%)", color: "hsl(var(--destructive))" },
    { name: "고구마", txt: "안정", bg: "hsl(150 55% 94%)", color: "hsl(var(--primary))" },
    { name: "무", txt: "하락 ↓", bg: "hsl(220 80% 96%)", color: "#1E6FD9" },
  ];
  const origins = [
    { name: "충남 공주시", badge: "배추 주산지", sub: "반입 비중 38% · 전주 대비 +15%", status: "공급↑", statusColor: "#6B2D8B", note: "가격 안정", noteCls: "text-muted-foreground" },
    { name: "전남 무안군", badge: "양파 주산지", sub: "반입 비중 42% · 전주 대비 -8%", status: "공급↓", statusColor: "hsl(var(--destructive))", note: "가격 상승", noteCls: "price-up" },
  ];
  return (
    <>
      {/* 5A 수급 현황 */}
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[12px] font-semibold text-muted-foreground mb-3">📊 주요 작물 수급 현황 — 이번 주</p>
          <div>
            {supply.map((s, i) => (
              <div key={s.name}>
                <div className="flex items-center py-2.5">
                  <span className="flex-1 text-[13px] font-bold text-foreground">{s.emoji} {s.name}</span>
                  <div className="text-right">
                    <p className={`text-[12px] font-bold ${s.statusCls}`} style={s.color ? { color: s.color } : undefined}>
                      {s.status}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.trend}</p>
                  </div>
                </div>
                {i < supply.length - 1 && <div className="h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 flex items-center justify-between gap-2 border-t border-border">
          <button
            onClick={() => navigate("/market")}
            className="h-10 px-3.5 rounded-full bg-secondary text-foreground text-[12px] font-bold"
          >
            📋 수급 리포트
          </button>
          <button
            onClick={() => navigate("/market")}
            className="text-[12px] font-semibold text-primary flex items-center gap-0.5"
          >
            상세 분석 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* 5B AI 중기 전망 */}
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[12px] font-semibold text-muted-foreground mb-3">🔮 AI 중기 가격 전망 (2~4주)</p>
          <div className="grid grid-cols-4 gap-1.5">
            {forecasts.map((f) => (
              <div key={f.name} className="rounded-lg px-2 py-2.5 text-center" style={{ background: f.bg }}>
                <p className="text-[10px] text-muted-foreground">{f.name}</p>
                <p className="text-[12px] font-extrabold mt-0.5" style={{ color: f.color }}>{f.txt}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: "hsl(280 50% 96%)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "#6B2D8B" }}>
              🤖 양파 향후 2주 추가 상승 가능성 높음 — 선제 조달 검토 권장
            </p>
          </div>
        </div>
        <div className="px-5 py-3 flex items-center justify-between gap-2 border-t border-border">
          <button
            onClick={() => navigate("/prediction")}
            className="h-10 px-3.5 rounded-full bg-secondary text-foreground text-[12px] font-bold"
          >
            📋 조달 시뮬레이션
          </button>
          <button
            onClick={() => navigate("/prediction")}
            className="text-[12px] font-semibold text-primary flex items-center gap-0.5"
          >
            예측 상세 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* 5C 산지 동향 */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-foreground">주요 산지 공급 동향</h2>
          <button onClick={() => navigate("/market")} className="text-[11px] font-semibold text-primary flex items-center gap-0.5">
            전체 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {origins.map((o, i) => (
            <button
              key={o.name}
              onClick={() => navigate("/market")}
              className={`w-full px-3 py-3 flex items-center gap-3 text-left active:bg-secondary/50 ${
                i < origins.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: "hsl(280 50% 96%)" }}>
                🗺️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold text-foreground">{o.name}</p>
                  <span className="text-[9px] font-bold px-1.5 py-[1px] rounded-md" style={{ background: "hsl(280 50% 96%)", color: "#6B2D8B" }}>
                    {o.badge}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{o.sub}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] font-extrabold" style={{ color: o.statusColor }}>{o.status}</p>
                <p className={`text-[10px] font-semibold mt-0.5 ${o.noteCls}`}>{o.note}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
