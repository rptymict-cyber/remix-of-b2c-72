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
import { findCrop, findMarket, seedPrice, seedPriceHistory } from "@/data/catalog";
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
  farmer: { dot: "bg-[#16A34A]", color: "text-[#16A34A]", name: "👨‍🌾 농민 모드", desc: "출하 시점 · 내 작물 시세 중심" },
  wholesaler: { dot: "bg-[#1F6FE8]", color: "text-[#1F6FE8]", name: "🏪 도매상 모드", desc: "반입량 · 낙찰가 · 법인 중심" },
  retailer: { dot: "bg-[#F08A24]", color: "text-[#F08A24]", name: "🛒 소매상 모드", desc: "매입 적정가 · 가격 정보 중심" },
  enterprise: { dot: "bg-[#8B5CF6]", color: "text-[#8B5CF6]", name: "🏢 기업 모드", desc: "수급 동향 · 산지 분석 중심" },
  default: { dot: "bg-[#16A34A]", color: "text-[#16A34A]", name: "👨‍🌾 농민 모드", desc: "출하 시점 · 내 작물 시세 중심" },
};

type KPI = { label: string; value: string; cls?: string };
type MovementRow = {
  emoji: string;
  name: string;
  badge?: string;
  badgeCls?: string;
  sub: string;
  rightTop?: string;
  rightLabel: string;
  rightValue: string;
  rightCls: string;
  up: boolean;
};

type CtaTarget = "market" | "prediction" | "notification";
type CtaParams = {
  tab?: string;
  metric?: string;
  sort?: string;
  view?: string;
  type?: string; // for notification settings
};
type Cta = { label: string; target: CtaTarget; params?: CtaParams };

type HomeConfig = {
  searchPlaceholder: string;
  chipsTitle: string;
  chips: { id: string; name: string; emoji: string }[];
  addChipLabel: string;
  heroSubtitle: string;
  unitChipLabel: string;
  mainPrice: number;
  mainUnit: string;
  subPrice: string;
  priceChangeBadge: { text: string; cls: string };
  graphColor: string;
  kpis: KPI[];
  insightTitle: string;
  insightLine1: React.ReactNode;
  insightLine2: React.ReactNode;
  insightBg: string;
  insightIconColor: string;
  ctaPrimary: Cta;
  ctaSecondary: Cta;
  // 컨텍스트(상세 화면 진입 시 함께 전달)
  ctaCrop: string;
  ctaVariety: string;
  ctaMarket: string;
  ctaPriceMode: PriceMode;
  movementTitle: string;
  movementDesc: string;
  movementRows: MovementRow[];
  secondary?: React.ReactNode;
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

  const userType: NonNullable<UserType> = (profile.userType as NonNullable<UserType>) ?? "farmer";
  const typeMeta = TYPE_META[userType];

  const crop = cropId ? findCrop(cropId) : findCrop("pepper");
  const market = findMarket(marketId);
  const basePrice = seedPrice(cropId || "pepper", marketId, variety);
  const { price: displayPrice, unitLabel } = computePriceByMode(priceMode, basePrice, crop.defaultUnitKg);
  const kgPrice = Math.round(basePrice / crop.defaultUnitKg);

  const subInfoFarmer =
    priceMode === "perKg"
      ? `실거래가 ${basePrice.toLocaleString()}원 / ${crop.defaultUnitKg}kg`
      : `환산가 ${kgPrice.toLocaleString()}원 / kg`;

  const farmerHistory = useMemo(
    () => seedPriceHistory(cropId || "pepper", marketId, variety, 7),
    [cropId, marketId, variety],
  );

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

  const openTypeSheet = () => {
    setPendingType(userType);
    setTypeSheetOpen(true);
  };
  const applyType = () => {
    setProfile({ userType: pendingType });
    setTypeSheetOpen(false);
  };

  // ------- Build configs per user type -------
  const aiUpliftPct = 6.3;
  const aiExtraPerBox = Math.round((basePrice * aiUpliftPct) / 100);
  const aiExtraTotal = Math.round((aiExtraPerBox * 50) / 1000) * 1000;

  const farmerConfig: HomeConfig = {
    searchPlaceholder: "품목, 품종, 시장 검색",
    chipsTitle: "내 작물",
    chips: myCropList.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji })),
    addChipLabel: "작물 추가",
    heroSubtitle: `${crop.emoji} ${crop.name} · ${variety} · ${market.name}`,
    unitChipLabel: `가격 기준 ${unitLabel}`,
    mainPrice: displayPrice,
    mainUnit: unitLabel,
    subPrice: subInfoFarmer,
    priceChangeBadge: { text: "전일 대비 +2.7%", cls: "bg-[hsl(0_72%_50%/0.10)] price-up" },
    graphColor: "hsl(0 72% 50%)",

    kpis: [
      { label: "전일", value: "+2.7%", cls: "price-up" },
      { label: "전주", value: "+8.1%", cls: "price-up" },
      { label: "전년", value: "-4.4%", cls: "price-down" },
      { label: "거래량", value: "1,240t", cls: "text-foreground" },
    ],
    insightTitle: "AI 출하 인사이트",
    insightLine1: (
      <>5월 24일 출하 시 현재보다 <span className="price-up font-extrabold">+{aiUpliftPct}%</span></>
    ),
    insightLine2: (
      <>50상자 기준 예상 추가 수익 <span className="text-[#1A3A1F] font-extrabold">+{aiExtraTotal.toLocaleString()}원</span></>
    ),
    insightBg: "bg-[#EAF7EA]",
    insightIconColor: "text-[#1A3A1F]",
    ctaPrimary: { label: "이 작물 경락가 조회", target: "market", params: { tab: "auction", sort: "latest" } },
    ctaSecondary: { label: "AI 예측 보기", target: "prediction" },
    ctaCrop: cropId || "pepper",
    ctaVariety: variety,
    ctaMarket: marketId,
    ctaPriceMode: priceMode,
    movementTitle: "오늘 급변 작물",
    movementDesc: "가격이나 거래량 변동이 큰 품목이에요.",
    movementRows: [
      { emoji: "🥬", name: "배추", badge: "거래량 급증", badgeCls: "bg-[#FBEFDC] text-[#A65A12]", sub: "서울 가락시장 · 10kg", rightTop: "12,800원", rightLabel: "가격 +4.8%", rightValue: "거래량 +31.2%", rightCls: "price-up", up: true },
      { emoji: "🧅", name: "양파", badge: "가격 상승", badgeCls: "bg-[hsl(0_72%_50%/0.10)] price-up", sub: "대구북부시장 · 15kg", rightTop: "18,400원", rightLabel: "가격 +6.1%", rightValue: "거래량 +12.4%", rightCls: "price-up", up: true },
      { emoji: "🍅", name: "토마토", badge: "하락 주의", badgeCls: "bg-[hsl(215_80%_55%/0.10)] price-down", sub: "부산엄궁시장 · 5kg", rightTop: "9,000원", rightLabel: "가격 -3.2%", rightValue: "거래량 -8.7%", rightCls: "price-down", up: false },
    ],
  };

  const wholesalerConfig: HomeConfig = {
    searchPlaceholder: "품목, 산지, 법인, 시장 검색",
    chipsTitle: "취급 품목",
    chips: [
      { id: "cabbage", name: "배추", emoji: "🥬" },
      { id: "onion", name: "양파", emoji: "🧅" },
      { id: "tomato", name: "토마토", emoji: "🍅" },
    ],
    addChipLabel: "품목 추가",
    heroSubtitle: "🥬 배추 · 서울 가락시장",
    unitChipLabel: "가격 기준 10kg",
    mainPrice: 12800,
    mainUnit: "10kg",
    subPrice: "실거래가 25,600원 / 20kg",
    priceChangeBadge: { text: "전일 대비 +3.2%", cls: "bg-[#E8F0FE] text-[#1F6FE8]" },
    graphColor: "#1F6FE8",

    kpis: [
      { label: "거래량", value: "+31.2%", cls: "text-[#1F6FE8]" },
      { label: "거래건수", value: "142건", cls: "text-foreground" },
      { label: "점유율", value: "28.4%", cls: "text-foreground" },
      { label: "주요 산지", value: "충남 공주", cls: "text-foreground" },
    ],
    insightTitle: "AI 거래 인사이트",
    insightLine1: <>반입량이 전일보다 크게 증가했어요.</>,
    insightLine2: <>서울청과 거래 비중이 가장 높습니다.</>,
    insightBg: "bg-[#E8F0FE]",
    insightIconColor: "text-[#1F6FE8]",
    ctaPrimary: { label: "경매내역 보기", target: "market", params: { tab: "auction", sort: "volume" } },
    ctaSecondary: { label: "법인 비교", target: "market", params: { tab: "corporation", metric: "avgPrice" } },
    ctaCrop: "cabbage",
    ctaVariety: "가을배추",
    ctaMarket: "garak",
    ctaPriceMode: "per10kg",
    movementTitle: "거래량 급변 품목",
    movementDesc: "오늘 반입량과 거래량 변동이 큰 품목이에요.",
    movementRows: [
      { emoji: "🥬", name: "배추", badge: "거래량 증가", badgeCls: "bg-[#E8F0FE] text-[#1F6FE8]", sub: "서울 가락시장 · 10kg", rightLabel: "거래량", rightValue: "+31.2%", rightCls: "price-up", up: true },
      { emoji: "🌱", name: "대파", badge: "거래량 증가", badgeCls: "bg-[#E8F0FE] text-[#1F6FE8]", sub: "대구북부시장 · 10kg", rightLabel: "거래량", rightValue: "+18.4%", rightCls: "price-up", up: true },
      { emoji: "🌿", name: "무", badge: "거래량 감소", badgeCls: "bg-[hsl(215_80%_55%/0.10)] price-down", sub: "전주 농수산시장 · 10kg", rightLabel: "거래량", rightValue: "-12.1%", rightCls: "price-down", up: false },
    ],
    secondary: (
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-foreground">법인별 낙찰가 현황</h2>
          <button onClick={() => navigate("/market?tab=corporation")} className="text-[11px] font-semibold text-primary flex items-center gap-0.5">
            전체 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {[
            { rank: "1위", name: "서울청과(주)", meta: "142건 · 276t · 점유율 32.8%", price: "38,900원" },
            { rank: "2위", name: "중앙청과(주)", meta: "128건 · 250t · 점유율 29.7%", price: "37,700원" },
            { rank: "3위", name: "동화청과(주)", meta: "87건 · 155t · 점유율 18.4%", price: "37,600원" },
          ].map((c, i, a) => (
            <button
              key={c.rank}
              onClick={() => navigate("/market?tab=corporation")}
              className={`w-full px-3 py-3 flex items-center gap-3 text-left active:bg-secondary/50 ${i < a.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] flex items-center justify-center shrink-0">
                <span className="text-[12px] font-extrabold text-[#1F6FE8]">{c.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground truncate">{c.name}</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 truncate">{c.meta}</p>
              </div>
              <p className="text-[13px] font-extrabold text-foreground shrink-0">{c.price}</p>
            </button>
          ))}
        </div>
      </section>
    ),
  };

  const retailerConfig: HomeConfig = {
    searchPlaceholder: "매입 품목, 시장, 가격 검색",
    chipsTitle: "매입 품목",
    chips: [
      { id: "onion", name: "양파", emoji: "🧅" },
      { id: "green_onion", name: "대파", emoji: "🌱" },
      { id: "tomato", name: "토마토", emoji: "🍅" },
    ],
    addChipLabel: "품목 추가",
    heroSubtitle: "🧅 양파 · 대구북부시장",
    unitChipLabel: "가격 기준 15kg",
    mainPrice: 18400,
    mainUnit: "15kg",
    subPrice: "실거래가 36,800원 / 30kg",
    priceChangeBadge: { text: "전일 대비 +6.1%", cls: "bg-[#FDECE0] text-[#C45000]" },
    graphColor: "#F08A24",

    kpis: [
      { label: "전일", value: "+6.1%", cls: "price-up" },
      { label: "시장 최저가", value: "17,900원", cls: "text-foreground" },
      { label: "권장 매입가", value: "18,000~18,600원", cls: "text-foreground" },
      { label: "거래량", value: "+12.4%", cls: "price-up" },
    ],
    insightTitle: "AI 매입 인사이트",
    insightLine1: <>최근 3일 연속 상승 중이에요.</>,
    insightLine2: <>오늘은 분할 매입을 권장합니다.</>,
    insightBg: "bg-[#FDECE0]",
    insightIconColor: "text-[#C45000]",
    ctaPrimary: { label: "매입가 비교", target: "market", params: { tab: "market", metric: "lowPrice", sort: "lowPrice" } },
    ctaSecondary: { label: "가격 알림 설정", target: "notification", params: { type: "price-alert" } },
    ctaCrop: "onion",
    ctaVariety: "황양파",
    ctaMarket: "daegu",
    ctaPriceMode: "cropDefault",
    movementTitle: "오늘 매입 주의 품목",
    movementDesc: "매입가 변동이 큰 품목이에요.",
    movementRows: [
      { emoji: "🧅", name: "양파", badge: "상승세 지속", badgeCls: "bg-[#FDECE0] text-[#C45000]", sub: "대구북부시장 · 15kg", rightTop: "18,400원", rightLabel: "가격", rightValue: "+6.1%", rightCls: "price-up", up: true },
      { emoji: "🌱", name: "대파", badge: "가격 상승", badgeCls: "bg-[hsl(0_72%_50%/0.10)] price-up", sub: "대구북부시장 · 10kg", rightTop: "4,800원", rightLabel: "가격", rightValue: "+4.2%", rightCls: "price-up", up: true },
      { emoji: "🍅", name: "토마토", badge: "하락 주의", badgeCls: "bg-[hsl(215_80%_55%/0.10)] price-down", sub: "부산엄궁시장 · 5kg", rightTop: "9,000원", rightLabel: "가격", rightValue: "-3.2%", rightCls: "price-down", up: false },
    ],
    secondary: (
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-sm)] p-4">
        <p className="text-[12px] font-semibold text-muted-foreground mb-3">시장별 매입가 비교</p>
        <div className="space-y-2">
          {[
            { name: "서울 가락시장", price: "18,700원" },
            { name: "대구 북부시장", price: "18,400원" },
            { name: "부산 엄궁시장", price: "17,900원", low: true },
          ].map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-background">
              <span className="text-[13px] font-semibold text-foreground">{m.name}</span>
              <span className={`text-[13px] font-extrabold ${m.low ? "text-[#C45000]" : "text-foreground"}`}>{m.price}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2.5">가장 낮은 시장: <span className="font-bold text-[#C45000]">부산 엄궁시장</span></p>
      </section>
    ),
  };

  const enterpriseConfig: HomeConfig = {
    searchPlaceholder: "조달 품목, 산지, 시장 검색",
    chipsTitle: "조달 품목",
    chips: [
      { id: "onion", name: "양파", emoji: "🧅" },
      { id: "cabbage", name: "배추", emoji: "🥬" },
      { id: "potato", name: "감자", emoji: "🥔" },
    ],
    addChipLabel: "품목 추가",
    heroSubtitle: "🧅 양파 · 전국 주요 시장",
    unitChipLabel: "가격 기준 15kg",
    mainPrice: 18400,
    mainUnit: "15kg",
    subPrice: "실거래가 36,800원 / 30kg",
    priceChangeBadge: { text: "전주 대비 +4.8%", cls: "bg-[#F1ECFB] text-[#7C3AED]" },
    graphColor: "#8B5CF6",

    kpis: [
      { label: "전주", value: "+4.8%", cls: "price-up" },
      { label: "공급 안정도", value: "주의", cls: "text-[#C45000]" },
      { label: "주요 산지", value: "전남 무안", cls: "text-foreground" },
      { label: "반입량", value: "-8.2%", cls: "price-down" },
    ],
    insightTitle: "AI 수급 인사이트",
    insightLine1: <>주요 산지 반입량이 감소하고 있어요.</>,
    insightLine2: <>다음 주 조달 단가 상승 가능성이 있습니다.</>,
    insightBg: "bg-[#F1ECFB]",
    insightIconColor: "text-[#7C3AED]",
    ctaPrimary: { label: "산지 분석 보기", route: "/market?tab=origin" },
    ctaSecondary: { label: "수급 전망 보기", route: "/prediction" },
    movementTitle: "공급 변동 품목",
    movementDesc: "공급량이나 산지 변동이 있는 품목이에요.",
    movementRows: [
      { emoji: "🧅", name: "양파", badge: "공급 주의", badgeCls: "bg-[#FDECE0] text-[#C45000]", sub: "전남 무안 · 15kg", rightLabel: "반입량", rightValue: "-8.2%", rightCls: "price-down", up: false },
      { emoji: "🥔", name: "감자", badge: "반입량 감소", badgeCls: "bg-[hsl(215_80%_55%/0.10)] price-down", sub: "강원 평창 · 20kg", rightLabel: "반입량", rightValue: "-6.4%", rightCls: "price-down", up: false },
      { emoji: "🥬", name: "배추", badge: "안정 후 상승", badgeCls: "bg-[#F1ECFB] text-[#7C3AED]", sub: "충남 논산 · 10kg", rightLabel: "기준가", rightValue: "+2.1%", rightCls: "price-up", up: true },
    ],
    secondary: (
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-sm)] p-4">
        <p className="text-[12px] font-semibold text-muted-foreground mb-3">주요 산지 공급 동향</p>
        <div className="space-y-2.5">
          {[
            { region: "전남 무안군", sub: "양파 주산지", meta: "반입 비중 42% · 전주 대비 -8%", status: "공급↓ · 가격 상승", cls: "text-[#C45000]" },
            { region: "충남 공주시", sub: "배추 주산지", meta: "반입 비중 38% · 전주 대비 +15%", status: "공급↑ · 가격 안정", cls: "text-primary" },
          ].map((r) => (
            <div key={r.region} className="rounded-xl bg-background p-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-foreground">{r.region}</p>
                <span className={`text-[11px] font-bold ${r.cls}`}>{r.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{r.sub}</p>
              <p className="text-[11px] text-foreground mt-1">{r.meta}</p>
            </div>
          ))}
        </div>
      </section>
    ),
  };

  const config =
    userType === "wholesaler" ? wholesalerConfig :
    userType === "retailer" ? retailerConfig :
    userType === "enterprise" ? enterpriseConfig :
    farmerConfig;

  const isFarmer = userType === "farmer";

  // mock 7-day data for non-farmer (so they always show)
  const mockHistory = useMemo(() => {
    const base = [12, 13, 11, 14, 13, 16, 15];
    const direction = config.movementRows[0]?.up ?? true;
    return direction ? base : [...base].reverse();
  }, [config.movementRows]);

  const heroHistory = isFarmer && hasCrops ? farmerHistory : mockHistory;

  return (
    <div className="h-full bg-background">
      <AppHeader title="농산물 시세" />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+0.75rem)] safe-bottom space-y-4">
        {/* 업데이트 상태 바 */}
        <section className={`${ss.bg} rounded-[14px] h-11 px-[14px] flex items-center justify-between transition-colors`}>
          <div className="flex items-center gap-2 min-w-0">
            {updateStatus === "error" || updateStatus === "delayed" ? (
              <AlertTriangle className={`w-4 h-4 shrink-0 ${ss.icon}`} />
            ) : (
              <MapPin className={`w-4 h-4 shrink-0 ${ss.icon}`} />
            )}
            <p className={`text-[12.5px] font-semibold truncate ${ss.text}`}>{statusText[updateStatus]}</p>
          </div>
          <button onClick={onRefresh} aria-label="새로고침" disabled={updateStatus === "loading"} className={`shrink-0 ml-2 ${ss.icon}`}>
            <RefreshCw className={`w-4 h-4 ${updateStatus === "loading" ? "animate-spin" : ""}`} />
          </button>
        </section>

        {/* 유형 배지 */}
        <div className="flex items-center gap-1.5 pt-1.5 pb-0.5">
          <span className={`w-[7px] h-[7px] rounded-full ${typeMeta.dot}`} />
          <span className={`text-[11.5px] font-bold ${typeMeta.color}`}>{typeMeta.name}</span>
          <span className="text-[10.5px] text-muted-foreground">{typeMeta.desc}</span>
          <button onClick={openTypeSheet} className="ml-auto text-[11px] font-semibold text-primary underline">변경</button>
        </div>

        {/* 검색창 */}
        <button
          onClick={() => navigate("/search")}
          className="w-full h-12 px-3.5 rounded-2xl bg-white border border-border flex items-center gap-2 text-left shadow-[var(--shadow-sm)]"
          aria-label="검색"
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-[13.5px] text-muted-foreground">{config.searchPlaceholder}</span>
        </button>

        {/* 품목 chip */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-foreground">{config.chipsTitle}</h2>
          </div>
          {config.chips.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center -mx-4 px-4">
              {config.chips.map((c) => {
                const sel = isFarmer && c.id === cropId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (!isFarmer) return;
                      const cd = findCrop(c.id);
                      sel ? setCropOpen(true) : setCrop(c.id, cd.varieties[0]);
                    }}
                    className={`flex-shrink-0 min-h-11 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                      sel ? "bg-[#1A3A1F] text-white shadow-[var(--shadow-sm)]" : "bg-card border border-border text-foreground"
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
                {config.addChipLabel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/crop/add")}
              className="w-full min-h-12 flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> {config.addChipLabel}
            </button>
          )}
        </section>

        {/* Hero 카드 */}
        {(!isFarmer || hasCrops) && (
          <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => isFarmer && setMarketOpen(true)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground text-left"
                >
                  <span className="truncate">{config.heroSubtitle}</span>
                  {isFarmer && <ChevronDown className="w-3 h-3 shrink-0" />}
                </button>
                <button
                  onClick={() => isFarmer && setPriceModeOpen(true)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-foreground text-[12px] font-semibold"
                >
                  {config.unitChipLabel}
                  {isFarmer && <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <div className="mt-3">
                <div className="flex items-end justify-between gap-2">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-[32px] font-extrabold text-foreground leading-none tracking-tight">
                      {config.mainPrice.toLocaleString()}
                    </span>
                    <span className="text-[14px] font-semibold text-muted-foreground">원 / {config.mainUnit}</span>
                  </div>
                  <span className={`shrink-0 text-[11px] font-extrabold px-2 py-1 rounded-full ${config.priceChangeBadge.cls}`}>
                    {config.priceChangeBadge.text}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1.5">{config.subPrice}</p>
              </div>
            </div>

            <div className="px-5 pt-3">
              <PriceSparkline data={heroHistory} width={340} height={70} className="w-full h-[70px]" color={config.graphColor} />
              <div className="flex justify-between mt-1 text-[9.5px] text-muted-foreground">
                <span>5/6</span><span>5/7</span><span>5/8</span><span>5/9</span><span>5/10</span><span>5/11</span><span className="font-bold text-foreground">5/12 오늘</span>
              </div>
            </div>


            <div className="px-5 pt-3">
              <div className="grid grid-cols-4 gap-1.5">
                {config.kpis.map((k) => (
                  <div key={k.label} className="bg-background rounded-lg px-2 py-2">
                    <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
                    <p className={`text-[12px] font-bold mt-0.5 leading-tight whitespace-nowrap ${k.cls ?? "text-foreground"}`}>
                      {k.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pt-3">
              <button
                onClick={() => navigate(config.ctaSecondary.route)}
                className={`w-full ${config.insightBg} rounded-[14px] px-3.5 py-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform`}
              >
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Sparkles className={`w-4 h-4 ${config.insightIconColor}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[11.5px] font-bold ${config.insightIconColor}`}>{config.insightTitle}</p>
                  <p className="text-[12.5px] text-foreground mt-0.5 leading-snug">{config.insightLine1}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{config.insightLine2}</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${config.insightIconColor}/60 shrink-0`} />
              </button>
            </div>

            <div className="px-5 py-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(config.ctaPrimary.route)}
                className="min-h-12 rounded-2xl border-2 border-primary bg-white text-primary text-[13px] font-bold"
              >
                {config.ctaPrimary.label}
              </button>
              <button
                onClick={() => navigate(config.ctaSecondary.route)}
                className="min-h-12 rounded-2xl bg-[#1A3A1F] text-white text-[13px] font-bold"
              >
                {config.ctaSecondary.label}
              </button>
            </div>
          </section>
        )}

        {/* 급변 / 주의 리스트 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{config.movementTitle}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{config.movementDesc}</p>
            </div>
            <button
              onClick={() => navigate(config.ctaPrimary.route)}
              className="text-[11px] font-semibold text-primary flex items-center gap-0.5 shrink-0"
            >
              전체 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {config.movementRows.map((r, idx) => {
              const base = [10, 12, 11, 14, 13, 16, 18];
              const hist = r.up ? base : [...base].reverse();
              const lineColor = r.up ? "hsl(0 72% 50%)" : "hsl(215 80% 55%)";
              return (
                <button
                  key={`${r.name}-${idx}`}
                  onClick={() => navigate(config.ctaPrimary.route)}
                  className="w-full bg-white rounded-[14px] border border-[#EFEFEF] shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-3 py-2.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform min-h-[76px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 w-[44%]">
                    <div className="w-10 h-10 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl shrink-0">
                      {r.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[13px] font-bold text-foreground truncate">{r.name}</span>
                        {r.badge && (
                          <span className={`text-[9.5px] font-bold px-1.5 py-[1px] rounded-md whitespace-nowrap ${r.badgeCls}`}>
                            {r.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-muted-foreground truncate leading-tight">{r.sub}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <PriceSparkline data={hist} width={64} height={28} showMarker={false} className="w-[64px] h-7" color={lineColor} />
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    {r.rightTop && (
                      <span className="text-[14px] font-extrabold text-foreground leading-none">{r.rightTop}</span>
                    )}
                    <span className={`text-[10.5px] font-bold ${r.rightTop ? "mt-1" : ""} leading-none ${r.rightCls}`}>
                      {r.rightLabel} {r.rightValue}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {config.secondary}
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
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${sel ? "bg-primary text-white" : "bg-muted"}`}>
                    {sel && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
          <button onClick={applyType} className="mt-5 w-full h-12 rounded-2xl bg-primary text-white text-[14px] font-bold">
            적용하기
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HomePage;
