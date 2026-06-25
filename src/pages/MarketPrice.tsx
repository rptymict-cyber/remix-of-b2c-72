import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown, ArrowUpRight, ArrowDownRight, Minus, Clock, Calendar,
  Layers, Building2, ChevronRight, X, MapPin, Sparkles, ArrowUpDown,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot,
} from "recharts";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { findCrop, findMarket, seedPrice } from "@/data/catalog";
import CropSheet from "@/components/sheets/CropSheet";
import MarketSheet from "@/components/sheets/MarketSheet";
import VarietySheet from "@/components/sheets/VarietySheet";
import FilterPill from "@/components/common/FilterPill";
import SortSheet, { SortOption } from "@/components/sheets/SortSheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

/* ---------- mock data ---------- */
const auctionFlow = [
  { time: "09시", price: 37000 },
  { time: "10시", price: 39200 },
  { time: "11시", price: 38000 },
  { time: "12시", price: 40200 },
  { time: "13시", price: 38700 },
  { time: "14시", price: 38000 },
];

const auctionRecords = [
  { time: "14:02", corp: "서울청과(주)", origin: "충남 공주시", variety: "일반토마토", qty: 52, unit: "5kg 상자", price: 38000, highlight: true },
  { time: "13:58", corp: "중앙청과(주)", origin: "충남 공주시", variety: "일반토마토", qty: 38, unit: "5kg 상자", price: 37500 },
  { time: "13:45", corp: "동화청과(주)", origin: "강원 강릉시", variety: "일반토마토", qty: 45, unit: "5kg 상자", price: 39000 },
  { time: "13:32", corp: "한국청과(주)", origin: "전북 익산시", variety: "일반토마토", qty: 30, unit: "5kg 상자", price: 36500 },
  { time: "13:21", corp: "서울청과(주)", origin: "충남 공주시", variety: "일반토마토", qty: 40, unit: "5kg 상자", price: 37800 },
  { time: "13:05", corp: "대아청과(주)", origin: "전남 해남군", variety: "일반토마토", qty: 28, unit: "5kg 상자", price: 36200 },
];

const marketData = [
  { name: "서울 가락시장", price: 38000, dayChange: 2.3, volume: 1280, share: 38.2, corps: ["서울청과(주)", "중앙청과(주)"] },
  { name: "서울 강서시장", price: 37600, dayChange: 1.4, volume: 720, share: 21.5, corps: ["강서청과(주)"] },
  { name: "부산 엄궁시장", price: 37200, dayChange: 0.8, volume: 540, share: 16.1, corps: ["부산청과(주)"] },
  { name: "대구 북부시장", price: 36800, dayChange: -0.5, volume: 480, share: 14.3, corps: ["대구청과(주)"] },
  { name: "인천 남촌시장", price: 36200, dayChange: -1.2, volume: 320, share: 9.9, corps: ["인천청과(주)"] },
];

const corpData = [
  { name: "서울청과(주)", avgPrice: 38900, share: 32.8, count: 142, volume: 276, origins: ["충남 공주", "전북 익산"] },
  { name: "중앙청과(주)", avgPrice: 37700, share: 29.7, count: 128, volume: 248, origins: ["충남 부여", "전남 해남"] },
  { name: "한국청과(주)", avgPrice: 37200, share: 21.4, count: 96, volume: 184, origins: ["강원 강릉", "전북 익산"] },
  { name: "동화청과(주)", avgPrice: 36800, share: 12.6, count: 64, volume: 112, origins: ["충남 공주"] },
  { name: "대아청과(주)", avgPrice: 36500, share: 3.5, count: 22, volume: 38, origins: ["전남 해남"] },
];

const originData = [
  { region: "충남 공주시", share: 38, avgPrice: 38000, volume: 486, x: 47, y: 47, markets: [["서울 가락시장", 42], ["대전 오정시장", 31], ["안양시장", 12]] as const },
  { region: "강원 강릉시", share: 21, avgPrice: 38500, volume: 268, x: 70, y: 22, markets: [["서울 가락시장", 48], ["서울 강서시장", 22], ["수원시장", 18]] as const },
  { region: "전남 해남군", share: 18, avgPrice: 36400, volume: 230, x: 32, y: 82, markets: [["광주서부시장", 38], ["서울 가락시장", 28], ["부산 엄궁시장", 22]] as const },
  { region: "경북 상주시", share: 12, avgPrice: 37200, volume: 154, x: 62, y: 52, markets: [["대구 북부시장", 52], ["서울 가락시장", 28]] as const },
  { region: "충북 청주시", share: 8, avgPrice: 37000, volume: 102, x: 50, y: 38, markets: [["청주시장", 42], ["서울 가락시장", 30]] as const },
];

const varietyData = [
  { name: "일반토마토", unit: "5kg", price: 38000, kg: 7600, dayChange: 2.3, volume: 1280 },
  { name: "방울토마토", unit: "1kg", price: 8500, kg: 8500, dayChange: 1.4, volume: 320 },
  { name: "대저토마토", unit: "0.5kg", price: 12000, kg: 24000, dayChange: 4.2, volume: 86 },
  { name: "대저토마토", unit: "5kg", price: 55000, kg: 11000, dayChange: 3.1, volume: 142 },
  { name: "완숙토마토", unit: "5kg", price: 32000, kg: 6400, dayChange: -1.2, volume: 268 },
];

const tabs = ["경매내역", "시장비교", "법인", "산지", "품종"] as const;
type Tab = typeof tabs[number];

const DATE_OPTIONS = ["오늘", "어제", "지난주"] as const;

/* ---------- helpers ---------- */
const Change = ({ v, big }: { v: number; big?: boolean }) => {
  const cls = v > 0 ? "price-up" : v < 0 ? "price-down" : "price-neutral";
  const Icon = v > 0 ? ArrowUpRight : v < 0 ? ArrowDownRight : Minus;
  return (
    <span className={`${cls} ${big ? "text-base" : "text-xs"} font-semibold flex items-center gap-0.5 whitespace-nowrap`}>
      <Icon className={big ? "w-4 h-4" : "w-3 h-3"} />
      {v > 0 ? "+" : ""}{v}%
    </span>
  );
};

/* ---------- map (stylized KR) ---------- */
const KRMap = ({ active, onPick }: { active: string | null; onPick: (r: string) => void }) => (
  <svg viewBox="0 0 100 110" className="w-full h-[180px]">
    <defs>
      <linearGradient id="krland" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="hsl(142 40% 92%)" />
        <stop offset="100%" stopColor="hsl(142 35% 86%)" />
      </linearGradient>
    </defs>
    <path
      d="M52 6 C 60 6, 68 10, 72 18 C 78 22, 80 28, 78 34 C 84 36, 86 44, 82 50 C 86 54, 84 62, 78 64 C 80 72, 74 80, 66 82 C 62 90, 54 96, 46 96 C 38 96, 30 92, 26 84 C 18 82, 14 74, 18 66 C 12 62, 14 54, 20 50 C 14 46, 16 36, 24 34 C 22 26, 28 18, 36 14 C 40 8, 46 6, 52 6 Z"
      fill="url(#krland)" stroke="hsl(142 30% 70%)" strokeWidth="0.5"
    />
    {originData.map((o) => {
      const r = 3 + o.share / 6;
      const on = active === o.region;
      return (
        <g key={o.region} onClick={() => onPick(o.region)} className="cursor-pointer">
          <circle cx={o.x} cy={o.y} r={r + 2} fill="hsl(142 52% 38%)" opacity={on ? 0.25 : 0.12} />
          <circle cx={o.x} cy={o.y} r={r} fill={on ? "hsl(142 60% 30%)" : "hsl(142 52% 45%)"} />
          <text x={o.x} y={o.y + 1.3} textAnchor="middle" fontSize="3.2" fill="white" fontWeight="700">{o.share}%</text>
        </g>
      );
    })}
  </svg>
);

/* ---------- detail sheet shell ---------- */
const DetailSheet = ({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode }) => (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent>
      <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] max-h-[80dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-extrabold text-foreground">{title}</h3>
          <button onClick={() => onOpenChange(false)} aria-label="닫기" className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </DrawerContent>
  </Drawer>
);

const KV = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2 text-[13px]">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-semibold text-foreground">{v}</span>
  </div>
);

/* ============================================================ */

const MarketPricePage = () => {
  const nav = useNavigate();
  const { cropId, variety, marketId } = useApp();
  const crop = findCrop(cropId);
  const market = findMarket(marketId);
  const price = seedPrice(cropId, marketId, variety);

  const [tab, setTab] = useState<Tab>("경매내역");
  const [date, setDate] = useState<typeof DATE_OPTIONS[number]>("오늘");
  const [cropOpen, setCropOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [varietyOpen, setVarietyOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // market-compare toggle
  const [cmpMode, setCmpMode] = useState<"price" | "share">("price");

  // corporation tab metric
  type CorpMetric = "avgPrice" | "share" | "count" | "volume";
  const [corpMetric, setCorpMetric] = useState<CorpMetric>("avgPrice");
  const [corpMetricOpen, setCorpMetricOpen] = useState(false);
  const corpMetricLabel: Record<CorpMetric, string> = {
    avgPrice: "평균가 기준",
    share: "점유율 기준",
    count: "거래건수 기준",
    volume: "거래량 기준",
  };
  const corpCardTitle: Record<CorpMetric, string> = {
    avgPrice: "법인별 평균가 순위",
    share: "법인별 거래 점유율",
    count: "법인별 거래건수 순위",
    volume: "법인별 거래량 순위",
  };


  // sort
  type SortKey = "latest" | "priceDesc" | "priceAsc" | "volume";
  const [sortKey, setSortKey] = useState<SortKey>("latest");
  const sortLabel: Record<SortKey, string> = { latest: "최신순", priceDesc: "높은 가격순", priceAsc: "낮은 가격순", volume: "거래량순" };
  const sortedAuctions = useMemo(() => {
    const arr = [...auctionRecords];
    if (sortKey === "priceDesc") arr.sort((a, b) => b.price - a.price);
    else if (sortKey === "priceAsc") arr.sort((a, b) => a.price - b.price);
    else if (sortKey === "volume") arr.sort((a, b) => b.qty - a.qty);
    return arr;
  }, [sortKey]);

  // detail sheet state
  const [auctionDetail, setAuctionDetail] = useState<typeof auctionRecords[number] | null>(null);
  const [marketDetail, setMarketDetail] = useState<typeof marketData[number] | null>(null);
  const [corpDetail, setCorpDetail] = useState<typeof corpData[number] | null>(null);
  const [originDetail, setOriginDetail] = useState<typeof originData[number] | null>(null);
  const [varietyDetail, setVarietyDetail] = useState<typeof varietyData[number] | null>(null);
  const [activeOriginPin, setActiveOriginPin] = useState<string | null>(null);

  const avgAuction = Math.round(auctionFlow.reduce((s, x) => s + x.price, 0) / auctionFlow.length);
  const maxAuction = Math.max(...auctionFlow.map((x) => x.price));
  const minAuction = Math.min(...auctionFlow.map((x) => x.price));

  const cmpMax = Math.max(...marketData.map((m) => (cmpMode === "price" ? m.price : m.share)));

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="h-full bg-background">
      <AppHeader
        title="실시간 시세"
        subtitle={refreshing ? "업데이트 중..." : "오늘 14:30 기준"}
        showRefresh
        onRefresh={onRefresh}
      />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+1rem)] pb-32 safe-bottom space-y-4">
        {/* 필터 칩 */}
        <div className="grid grid-cols-2 gap-2">
          <FilterPill onClick={() => setCropOpen(true)} icon={<span className="text-base leading-none">{crop.emoji}</span>} label={crop.name} />
          <FilterPill onClick={() => setVarietyOpen(true)} icon={<Layers className="w-4 h-4" />} label={variety} />
          <FilterPill onClick={() => setMarketOpen(true)} icon={<Building2 className="w-4 h-4" />} label={market.name} />
          <FilterPill onClick={() => setDateOpen(true)} icon={<Calendar className="w-4 h-4" />} label={date} />
        </div>

        {/* 요약 카드 + 미니 차트 */}
        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground">
              {crop.emoji} {crop.name} · {variety} · {market.name}
            </p>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="px-5 pb-3 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[30px] font-extrabold text-foreground leading-none tracking-tight">{price.toLocaleString()}</span>
                <span className="text-sm font-medium text-muted-foreground">원/{crop.defaultUnitKg}kg</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                <Change v={2.3} big />
                <span className="text-[11px] text-muted-foreground">전일 대비</span>
              </div>
            </div>
            {/* 미니 sparkline */}
            <div className="w-[120px] h-[56px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={auctionFlow}>
                  <Line type="monotone" dataKey="price" stroke="hsl(0 70% 55%)" strokeWidth={2} dot={false} />
                  <ReferenceDot x="14시" y={38000} r={3} fill="hsl(0 70% 55%)" stroke="white" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mx-5 mb-3 grid grid-cols-3 gap-2">
            <div className="bg-background rounded-xl px-2.5 py-2"><p className="text-[10px] text-muted-foreground">전일</p><p className="text-[13px] font-bold price-up">+2.3%</p></div>
            <div className="bg-background rounded-xl px-2.5 py-2"><p className="text-[10px] text-muted-foreground">전주</p><p className="text-[13px] font-bold price-up">+6.8%</p></div>
            <div className="bg-background rounded-xl px-2.5 py-2"><p className="text-[10px] text-muted-foreground">전년</p><p className="text-[13px] font-bold price-up">+14.2%</p></div>
          </div>
          <div className="mx-5 mb-4 grid grid-cols-4 gap-2">
            <div className="bg-background rounded-xl px-2 py-2"><p className="text-[10px] text-muted-foreground">평균</p><p className="text-[12px] font-bold text-foreground">38,000원</p></div>
            <div className="bg-background rounded-xl px-2 py-2"><p className="text-[10px] text-muted-foreground">최고</p><p className="text-[12px] font-bold price-up">42,000원</p></div>
            <div className="bg-background rounded-xl px-2 py-2"><p className="text-[10px] text-muted-foreground">최저</p><p className="text-[12px] font-bold price-down">35,000원</p></div>
            <div className="bg-background rounded-xl px-2 py-2"><p className="text-[10px] text-muted-foreground">거래량</p><p className="text-[12px] font-bold text-foreground">1,280t</p></div>
          </div>
          <div className="border-t border-border px-5 py-2.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>2026.05.21 14:00 업데이트</span>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-4 border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`analysis-tab ${tab === t ? "analysis-tab-active" : ""}`}>{t}</button>
          ))}
        </div>

        {/* ===== 경매내역 ===== */}
        {tab === "경매내역" && (
          <div className="space-y-3 animate-fade-in">
            {/* 오늘 경매 흐름 */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-foreground">오늘 경매 흐름</span>
                <span className="text-[10px] text-muted-foreground">평균 {avgAuction.toLocaleString()}원</span>
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={auctionFlow} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(220 10% 94%)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215 10% 50%)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[34000, 42000]} tick={{ fontSize: 10, fill: "hsl(215 10% 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}천`} />
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`${v.toLocaleString()}원`, "경락가"]} />
                  <ReferenceLine y={avgAuction} stroke="hsl(215 10% 60%)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="price" stroke="hsl(0 70% 55%)" strokeWidth={2.2} dot={{ r: 3, fill: "hsl(0 70% 55%)" }} activeDot={{ r: 5 }} />
                  <ReferenceDot x="14시" y={38000} r={5} fill="hsl(0 70% 55%)" stroke="white" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className="bg-background rounded-lg px-2 py-1.5 text-center"><p className="text-[10px] text-muted-foreground">최고</p><p className="text-[12px] font-bold price-up">{maxAuction.toLocaleString()}</p></div>
                <div className="bg-background rounded-lg px-2 py-1.5 text-center"><p className="text-[10px] text-muted-foreground">최저</p><p className="text-[12px] font-bold price-down">{minAuction.toLocaleString()}</p></div>
                <div className="bg-background rounded-lg px-2 py-1.5 text-center"><p className="text-[10px] text-muted-foreground">평균</p><p className="text-[12px] font-bold text-foreground">{avgAuction.toLocaleString()}</p></div>
                <div className="bg-background rounded-lg px-2 py-1.5 text-center"><p className="text-[10px] text-muted-foreground">거래량</p><p className="text-[12px] font-bold text-foreground">1,280t</p></div>
              </div>
            </div>

            {/* 경매내역 표 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">경매내역 <span className="text-[11px] font-medium text-muted-foreground">({sortLabel[sortKey]})</span></span>
              <span className="text-[11px] text-muted-foreground">총 245건 · 평균가 38,000원</span>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[1.2fr_2.4fr_1.4fr_1.6fr] px-3 py-2 text-[10px] text-muted-foreground border-b border-border">
                <span>시간</span><span>법인 / 산지</span><span className="text-right">수량</span><span className="text-right">경락가</span>
              </div>
              <div className="divide-y divide-border">
                {sortedAuctions.map((r, i) => (
                  <button key={i} onClick={() => setAuctionDetail(r)} className="w-full grid grid-cols-[1.2fr_2.4fr_1.4fr_1.6fr] px-3 py-2.5 text-[12px] text-left active:bg-secondary/50">
                    <span className={`font-bold ${r.highlight ? "price-up" : "text-foreground"}`}>{r.time}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{r.corp}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.origin} · {r.variety}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{r.qty}개</p>
                      <p className="text-[10px] text-muted-foreground">{r.unit}</p>
                    </div>
                    <span className={`text-right font-bold self-center ${r.highlight ? "price-up" : "text-foreground"}`}>{r.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== 시장비교 ===== */}
        {tab === "시장비교" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-bold text-foreground">시장별 {cmpMode === "price" ? "현재가" : "거래량 점유율"} 비교</span>
                <div className="flex bg-secondary rounded-full p-0.5 text-[11px]">
                  <button onClick={() => setCmpMode("price")} className={`px-2.5 py-1 rounded-full font-semibold ${cmpMode === "price" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}>가격</button>
                  <button onClick={() => setCmpMode("share")} className={`px-2.5 py-1 rounded-full font-semibold ${cmpMode === "share" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}>점유율</button>
                </div>
              </div>
              <div className="space-y-2.5">
                {[...marketData].sort((a, b) => (cmpMode === "price" ? b.price - a.price : b.share - a.share)).map((m) => {
                  const val = cmpMode === "price" ? m.price : m.share;
                  const pct = (val / cmpMax) * 100;
                  return (
                    <button key={m.name} onClick={() => setMarketDetail(m)} className="w-full text-left">
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="font-semibold text-foreground">{m.name}</span>
                        <span className="font-bold text-foreground">{cmpMode === "price" ? `${m.price.toLocaleString()}원` : `${m.share}%`}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[2fr_1.6fr_1.2fr_1.4fr] px-3 py-2 text-[10px] text-muted-foreground border-b border-border">
                <span>시장</span><span className="text-right">현재가</span><span className="text-right">전일</span><span className="text-right">거래량</span>
              </div>
              <div className="divide-y divide-border">
                {marketData.map((m) => (
                  <button key={m.name} onClick={() => setMarketDetail(m)} className="w-full grid grid-cols-[2fr_1.6fr_1.2fr_1.4fr] px-3 py-2.5 text-[12px] text-left active:bg-secondary/50">
                    <span className="font-semibold text-foreground truncate">{m.name}</span>
                    <span className="text-right font-bold text-foreground">{m.price.toLocaleString()}</span>
                    <span className={`text-right font-medium ${m.dayChange > 0 ? "price-up" : m.dayChange < 0 ? "price-down" : "price-neutral"}`}>{m.dayChange > 0 ? "+" : ""}{m.dayChange}%</span>
                    <span className="text-right text-muted-foreground">{m.volume}t</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== 법인 ===== */}
        {tab === "법인" && (() => {
          const formatValue = (c: typeof corpData[number]) => {
            if (corpMetric === "avgPrice") return `${c.avgPrice.toLocaleString()}원`;
            if (corpMetric === "share") return `${c.share}%`;
            if (corpMetric === "count") return `${c.count}건`;
            return `${c.volume}t`;
          };
          const formatSub = (c: typeof corpData[number]) => {
            if (corpMetric === "avgPrice") return `점유율 ${c.share}% · ${c.count}건`;
            if (corpMetric === "share") return `평균가 ${c.avgPrice.toLocaleString()}원 · ${c.count}건`;
            if (corpMetric === "count") return `평균가 ${c.avgPrice.toLocaleString()}원 · 점유율 ${c.share}%`;
            return `평균가 ${c.avgPrice.toLocaleString()}원 · 점유율 ${c.share}%`;
          };
          const getVal = (c: typeof corpData[number]) =>
            corpMetric === "avgPrice" ? c.avgPrice : corpMetric === "share" ? c.share : corpMetric === "count" ? c.count : c.volume;
          const sortedCorps = [...corpData].sort((a, b) => getVal(b) - getVal(a));
          const maxVal = Math.max(...sortedCorps.map(getVal));

          return (
            <div className="space-y-3 animate-fade-in">
              <div className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[13px] font-bold text-foreground">{corpCardTitle[corpMetric]}</span>
                  <button
                    onClick={() => setCorpMetricOpen(true)}
                    className="h-9 px-3 inline-flex items-center gap-1 rounded-full border border-border bg-card text-[12px] font-bold text-primary active:scale-[0.98] shrink-0"
                  >
                    {corpMetricLabel[corpMetric]}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">{market.name} 기준</p>
                <div className="space-y-3">
                  {sortedCorps.map((c, i) => (
                    <button key={c.name} onClick={() => setCorpDetail(c)} className="w-full text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-extrabold text-primary w-4 text-center shrink-0">{i + 1}</span>
                        <span className="flex-1 text-[12px] font-semibold text-foreground truncate">{c.name}</span>
                        <span className="text-[12px] font-extrabold text-foreground shrink-0">{formatValue(c)}</span>
                      </div>
                      <div className="pl-6">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(getVal(c) / maxVal) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{formatSub(c)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr] px-3 py-2 text-[10px] text-muted-foreground border-b border-border">
                  <span>법인명</span><span className="text-right">평균가</span><span className="text-right">점유율</span><span className="text-right">거래량</span>
                </div>
                <div className="divide-y divide-border">
                  {sortedCorps.map((c) => (
                    <button key={c.name} onClick={() => setCorpDetail(c)} className="w-full grid grid-cols-[2fr_1.4fr_1fr_1fr] px-3 py-2.5 text-[12px] text-left active:bg-secondary/50">
                      <span className="font-semibold text-foreground truncate">{c.name}</span>
                      <span className="text-right font-bold text-foreground">{c.avgPrice.toLocaleString()}</span>
                      <span className="text-right text-muted-foreground">{c.share}%</span>
                      <span className="text-right text-muted-foreground">{c.volume}t</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}



        {/* ===== 산지 ===== */}
        {tab === "산지" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-foreground">산지별 출하 비중</span>
                <span className="text-[10px] text-muted-foreground">지도에서 산지를 선택해보세요</span>
              </div>
              <KRMap active={activeOriginPin} onPick={(r) => {
                setActiveOriginPin(r);
                const o = originData.find((x) => x.region === r);
                if (o) setOriginDetail(o);
              }} />
            </div>

            <div className="space-y-2">
              {originData.map((o, i) => (
                <button key={o.region} onClick={() => { setActiveOriginPin(o.region); setOriginDetail(o); }} className="w-full flex items-center gap-3 bg-card rounded-xl border border-border px-3.5 py-3 active:bg-secondary/50 text-left">
                  <span className="text-base font-extrabold text-primary w-5 text-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-foreground">{o.region}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{o.markets.map(([n, p]) => `${n} ${p}%`).join(" · ")}</p>
                  </div>
                  <span className="text-[15px] font-extrabold text-foreground tabular-nums shrink-0">{o.share}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== 품종 ===== */}
        {tab === "품종" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-bold text-foreground">품종 · 단량별 평균가 비교</span>
                <span className="text-[10px] text-muted-foreground">kg 환산 포함</span>
              </div>
              <div className="space-y-3">
                {varietyData.map((v) => {
                  const maxKg = Math.max(...varietyData.map((x) => x.kg));
                  return (
                    <button key={`${v.name}-${v.unit}`} onClick={() => setVarietyDetail(v)} className="w-full text-left">
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="font-semibold text-foreground">{v.name} <span className="text-muted-foreground">/ {v.unit}</span></span>
                        <span className="text-foreground"><b>{v.price.toLocaleString()}원</b> <span className="text-muted-foreground">· {v.kg.toLocaleString()}원/kg</span></span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(v.kg / maxKg) * 100}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[2fr_1.6fr_1.1fr_1.2fr] px-3 py-2 text-[10px] text-muted-foreground border-b border-border">
                <span>품종 / 단량</span><span className="text-right">평균가</span><span className="text-right">전일</span><span className="text-right">거래량</span>
              </div>
              <div className="divide-y divide-border">
                {varietyData.map((v) => (
                  <button key={`${v.name}-${v.unit}-row`} onClick={() => setVarietyDetail(v)} className="w-full grid grid-cols-[2fr_1.6fr_1.1fr_1.2fr] px-3 py-2.5 text-[12px] text-left active:bg-secondary/50">
                    <div className="min-w-0"><p className="font-semibold text-foreground truncate">{v.name}</p><p className="text-[10px] text-muted-foreground">{v.unit}</p></div>
                    <span className="text-right font-bold text-foreground self-center">{v.price.toLocaleString()}</span>
                    <span className={`text-right font-medium self-center ${v.dayChange > 0 ? "price-up" : v.dayChange < 0 ? "price-down" : "price-neutral"}`}>{v.dayChange > 0 ? "+" : ""}{v.dayChange}%</span>
                    <span className="text-right text-muted-foreground self-center">{v.volume}t</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI 예측 CTA */}
        <button onClick={() => nav("/prediction")} className="w-full bg-[hsl(142_45%_94%)] border border-[hsl(142_40%_82%)] rounded-2xl px-4 py-3.5 flex items-center gap-3 active:opacity-80">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[12px] font-bold text-primary">AI 출하 예측</p>
            <p className="text-[13px] font-bold text-foreground">5월 24일 출하 시 현재보다 <span className="price-up">+6.3%</span></p>
            <p className="text-[11px] text-muted-foreground">50상자 기준 약 +120,000원 추가 수익</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </button>
      </main>

      {/* 정렬 floating button (경매내역에서만 표시) */}
      {tab === "경매내역" && (
        <button
          onClick={() => setSortOpen(true)}
          className="fixed z-[90] right-4 bg-primary text-primary-foreground rounded-full shadow-lg px-4 py-3 flex items-center gap-1.5 text-[12px] font-bold active:opacity-90"
          style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 16px)" }}
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortLabel[sortKey]}
        </button>
      )}

      <BottomNav />

      {/* 필터 시트 */}
      <CropSheet open={cropOpen} onOpenChange={setCropOpen} />
      <MarketSheet open={marketOpen} onOpenChange={setMarketOpen} />
      <VarietySheet open={varietyOpen} onOpenChange={setVarietyOpen} />

      <SortSheet<typeof DATE_OPTIONS[number]>
        open={dateOpen}
        onOpenChange={setDateOpen}
        title="기간 선택"
        selected={date}
        onSelect={setDate}
        options={DATE_OPTIONS.map((d) => ({ key: d, label: d })) as SortOption<typeof DATE_OPTIONS[number]>[]}
      />

      <SortSheet<SortKey>
        open={sortOpen}
        onOpenChange={setSortOpen}
        title="정렬 기준"
        selected={sortKey}
        onSelect={setSortKey}
        options={[
          { key: "latest", label: "최신순" },
          { key: "priceDesc", label: "높은 가격순" },
          { key: "priceAsc", label: "낮은 가격순" },
          { key: "volume", label: "거래량순" },
        ]}
      />

      <SortSheet<CorpMetric>
        open={corpMetricOpen}
        onOpenChange={setCorpMetricOpen}
        title="비교 기준 선택"
        selected={corpMetric}
        onSelect={setCorpMetric}
        options={[
          { key: "avgPrice", label: "평균가 기준" },
          { key: "share", label: "점유율 기준" },
          { key: "count", label: "거래건수 기준" },
          { key: "volume", label: "거래량 기준" },
        ]}
      />




      {/* 경매 상세 */}
      <DetailSheet open={!!auctionDetail} onOpenChange={(o) => !o && setAuctionDetail(null)} title="경매 상세 정보">
        {auctionDetail && (
          <>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 mb-3">
              <p className="text-[28px] font-extrabold text-foreground leading-none">{auctionDetail.price.toLocaleString()}<span className="text-base font-bold ml-1">원</span></p>
              <p className="text-[11px] text-muted-foreground mt-1">오늘 평균가 대비 <span className={auctionDetail.price >= avgAuction ? "price-up font-bold" : "price-down font-bold"}>{auctionDetail.price >= avgAuction ? "+" : ""}{(((auctionDetail.price - avgAuction) / avgAuction) * 100).toFixed(1)}%</span></p>
            </div>
            <div className="divide-y divide-border">
              <KV k="시간" v={`2026.05.21 ${auctionDetail.time}`} />
              <KV k="작물" v={crop.name} />
              <KV k="품종" v={auctionDetail.variety} />
              <KV k="시장" v={market.name} />
              <KV k="법인" v={auctionDetail.corp} />
              <KV k="산지" v={auctionDetail.origin} />
              <KV k="수량 / 단량" v={`${auctionDetail.qty}개 / ${auctionDetail.unit}`} />
            </div>
            <button onClick={() => { setAuctionDetail(null); nav("/prediction"); }} className="mt-4 w-full bg-primary text-primary-foreground rounded-xl py-3.5 text-[14px] font-bold">이 거래 기준 AI 예측 보기</button>
          </>
        )}
      </DetailSheet>

      {/* 시장 상세 */}
      <DetailSheet open={!!marketDetail} onOpenChange={(o) => !o && setMarketDetail(null)} title="시장 상세 정보">
        {marketDetail && (
          <>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 mb-3">
              <p className="text-[13px] font-bold text-foreground">{marketDetail.name}</p>
              <p className="text-[28px] font-extrabold text-foreground leading-none mt-1">{marketDetail.price.toLocaleString()}<span className="text-base font-bold ml-1">원</span></p>
              <div className="mt-1 flex items-center gap-2"><Change v={marketDetail.dayChange} /><span className="text-[11px] text-muted-foreground">전일 대비</span></div>
            </div>
            <div className="divide-y divide-border">
              <KV k="현재가" v={`${marketDetail.price.toLocaleString()}원`} />
              <KV k="전일 대비" v={<Change v={marketDetail.dayChange} />} />
              <KV k="거래량" v={`${marketDetail.volume}t`} />
              <KV k="점유율" v={`${marketDetail.share}%`} />
              <KV k="평균가 대비" v={<span className={marketDetail.price >= 37000 ? "price-up font-bold" : "price-down font-bold"}>{marketDetail.price >= 37000 ? "높음" : "낮음"}</span>} />
              <KV k="주요 거래 법인" v={marketDetail.corps.join(", ")} />
            </div>
            <button onClick={() => { setMarketDetail(null); setTab("경매내역"); }} className="mt-4 w-full bg-primary text-primary-foreground rounded-xl py-3.5 text-[14px] font-bold">이 시장 경매내역 보기</button>
          </>
        )}
      </DetailSheet>

      {/* 법인 상세 */}
      <DetailSheet open={!!corpDetail} onOpenChange={(o) => !o && setCorpDetail(null)} title="법인 상세 정보">
        {corpDetail && (
          <>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 mb-3">
              <p className="text-[13px] font-bold text-foreground">{corpDetail.name}</p>
              <p className="text-[28px] font-extrabold text-foreground leading-none mt-1">{corpDetail.avgPrice.toLocaleString()}<span className="text-base font-bold ml-1">원</span><span className="text-[11px] font-medium text-muted-foreground ml-1">/ 5kg</span></p>
            </div>
            <div className="divide-y divide-border">
              <KV k="평균가" v={`${corpDetail.avgPrice.toLocaleString()}원`} />
              <KV k="점유율" v={`${corpDetail.share}%`} />
              <KV k="거래건수" v={`${corpDetail.count}건`} />
              <KV k="거래량" v={`${corpDetail.volume}t`} />
              <KV k="주요 산지" v={corpDetail.origins.join(", ")} />
            </div>
            <div className="mt-3 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={auctionFlow}><Line type="monotone" dataKey="price" stroke="hsl(142 52% 38%)" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </div>
            <button onClick={() => { setCorpDetail(null); setTab("경매내역"); }} className="mt-3 w-full bg-primary text-primary-foreground rounded-xl py-3.5 text-[14px] font-bold">이 법인 거래내역 보기</button>
          </>
        )}
      </DetailSheet>

      {/* 산지 상세 */}
      <DetailSheet open={!!originDetail} onOpenChange={(o) => !o && setOriginDetail(null)} title="산지 상세 정보">
        {originDetail && (
          <>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[13px] font-bold text-foreground">{originDetail.region}</p>
                <p className="text-[11px] text-muted-foreground">점유율 <b className="text-foreground">{originDetail.share}%</b></p>
              </div>
            </div>
            <div className="divide-y divide-border">
              <KV k="평균 경락가" v={`${originDetail.avgPrice.toLocaleString()}원 / 5kg`} />
              <KV k="거래량" v={`${originDetail.volume}t`} />
            </div>
            <p className="text-[12px] font-bold text-foreground mt-4 mb-2">주요 출하 시장</p>
            <div className="space-y-2">
              {originDetail.markets.map(([n, p]) => (
                <div key={n}>
                  <div className="flex justify-between text-[12px] mb-1"><span className="text-foreground">{n}</span><span className="font-bold text-foreground">{p}%</span></div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${p}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-[11px] text-muted-foreground mb-1">최근 3일 반입량 추이</p>
              <div className="h-14">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={auctionFlow.slice(-4)}><Line type="monotone" dataKey="price" stroke="hsl(210 70% 50%)" strokeWidth={2} dot={false} /></LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <button onClick={() => { setOriginDetail(null); setTab("경매내역"); }} className="mt-3 w-full bg-primary text-primary-foreground rounded-xl py-3.5 text-[14px] font-bold">이 산지 경매내역 보기</button>
          </>
        )}
      </DetailSheet>

      {/* 품종 상세 */}
      <DetailSheet open={!!varietyDetail} onOpenChange={(o) => !o && setVarietyDetail(null)} title="품종 상세 정보">
        {varietyDetail && (
          <>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 mb-3">
              <p className="text-[13px] font-bold text-foreground">{varietyDetail.name} · {varietyDetail.unit}</p>
              <p className="text-[28px] font-extrabold text-foreground leading-none mt-1">{varietyDetail.price.toLocaleString()}<span className="text-base font-bold ml-1">원</span></p>
              <p className="text-[11px] text-muted-foreground mt-1">kg 환산가 <b className="text-foreground">{varietyDetail.kg.toLocaleString()}원/kg</b></p>
            </div>
            <div className="divide-y divide-border">
              <KV k="실거래 단량" v={varietyDetail.unit} />
              <KV k="평균가" v={`${varietyDetail.price.toLocaleString()}원`} />
              <KV k="kg 환산가" v={`${varietyDetail.kg.toLocaleString()}원/kg`} />
              <KV k="전일 대비" v={<Change v={varietyDetail.dayChange} />} />
              <KV k="거래량" v={`${varietyDetail.volume}t`} />
              <KV k="주요 시장" v="서울 가락시장, 부산 엄궁시장" />
            </div>
            <div className="mt-3 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={auctionFlow}><Line type="monotone" dataKey="price" stroke="hsl(142 52% 38%)" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </div>
            <button onClick={() => { setVarietyDetail(null); setTab("경매내역"); }} className="mt-3 w-full bg-primary text-primary-foreground rounded-xl py-3.5 text-[14px] font-bold">이 품종 경매내역 보기</button>
          </>
        )}
      </DetailSheet>
    </div>
  );
};

export default MarketPricePage;
