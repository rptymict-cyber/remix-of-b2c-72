import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, BrainCircuit, TrendingUp, AlertTriangle, CloudRain, BarChart2, Calendar, Layers, Zap, Clock, Package, MapPin, Building2, Sparkles } from "lucide-react";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { findCrop, findMarket } from "@/data/catalog";
import CropSheet from "@/components/sheets/CropSheet";
import MarketSheet from "@/components/sheets/MarketSheet";
import VarietySheet from "@/components/sheets/VarietySheet";
import QtySheet from "@/components/sheets/QtySheet";
import FilterPill from "@/components/common/FilterPill";

const predictionChartData = [
  { date: "11/5", price: 8100, type: "actual" },
  { date: "11/6", price: 8250, type: "actual" },
  { date: "11/7", price: 8180, type: "actual" },
  { date: "11/8", price: 8350, type: "actual" },
  { date: "11/9", price: 8500, type: "actual" },
  { date: "11/10", price: null, predicted: 8580, type: "predicted" },
  { date: "11/11", price: null, predicted: 8700, type: "predicted", holiday: true },
  { date: "11/12", price: null, predicted: 9100, type: "predicted", recommended: true },
  { date: "11/13", price: null, predicted: 9050, type: "predicted" },
  { date: "11/14", price: null, predicted: 8920, type: "predicted" },
  { date: "11/15", price: null, predicted: 8800, type: "predicted" },
  { date: "11/16", price: null, predicted: 8750, type: "predicted" },
  { date: "11/17", price: null, predicted: 8680, type: "predicted" },
  { date: "11/18", price: null, predicted: 8620, type: "predicted" },
  { date: "11/19", price: null, predicted: 8580, type: "predicted" },
];

const periodOptions = ["7일", "10일", "14일", "30일"];

interface PredictionPageProps {
  defaultExpanded?: boolean;
}

const PredictionPage = ({ defaultExpanded = false }: PredictionPageProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [selectedPeriod, setSelectedPeriod] = useState("10일");
  const { cropId, variety, marketId, shipQtyKg, setCrop, setVariety, setMarket } = useApp();
  const [sp] = useSearchParams();
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const c = sp.get("crop"); const v = sp.get("variety"); const m = sp.get("market");
    if (c) setCrop(c, v ?? undefined);
    if (v) setVariety(v);
    if (m) setMarket(m);
  }, []);
  const fromHome = sp.get("entrySource") === "home";
  const pm = sp.get("priceMode");
  const crop = findCrop(cropId);
  const market = findMarket(marketId);
  const [cropOpen, setCropOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [varietyOpen, setVarietyOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const pmLabel = pm === "perKg" ? "1kg" : pm === "per10kg" ? "10kg" : pm === "per20kg" ? "20kg" : pm === "per100kg" ? "100kg" : `${crop.defaultUnitKg}kg`;

  const unitWeight = crop.defaultUnitKg;
  const quantity = Math.max(1, Math.round(shipQtyKg / unitWeight));
  const totalKg = quantity * unitWeight;
  const currentPrice = 8500;
  const predictedPrice = 9100;
  const currentTotal = currentPrice * quantity;
  const predictedTotal = predictedPrice * quantity;
  const diff = predictedTotal - currentTotal;
  const changePercent = ((predictedPrice - currentPrice) / currentPrice * 100).toFixed(1);

  return (
    <div className="h-full bg-background">
      <AppHeader title="AI 가격 예측" />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+1.25rem)] safe-bottom space-y-5">
        {fromHome && (
          <div className="bg-[#EAF7EA] rounded-2xl p-3.5 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#1A3A1F] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12px] font-extrabold text-[#1A3A1F]">이 예측의 기준 데이터</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{crop.emoji} {crop.name} · {variety} · {market.name}</p>
              <p className="text-[11px] text-muted-foreground">현재가 {currentPrice.toLocaleString()}원 / {pmLabel} · 기준시각 오늘 14:30</p>
            </div>
          </div>
        )}
        {/* 상단 안내 */}
        <div>
          <p className="text-xs text-muted-foreground">언제 출하할지 고민되시나요?</p>
          <p className="text-base font-bold text-foreground mt-0.5">AI가 최적 출하 시점을 분석합니다</p>
        </div>


        {/* 조건 설정 */}
        <div className="space-y-3">
          <p className="text-[13px] font-bold text-foreground">분석 조건</p>
          <div className="grid grid-cols-2 gap-2">
            <FilterPill onClick={() => setCropOpen(true)} icon={<span className="text-base leading-none">{crop.emoji}</span>} label={crop.name} />
            <FilterPill onClick={() => setVarietyOpen(true)} icon={<Layers className="w-4 h-4" />} label={variety} />
            <FilterPill onClick={() => setMarketOpen(true)} icon={<Building2 className="w-4 h-4" />} label={market.name} />
            <FilterPill onClick={() => setQtyOpen(true)} icon={<Package className="w-4 h-4" />} label={`${quantity}상자 · ${unitWeight}kg`} />
          </div>
          <div className="flex gap-1.5">
            {periodOptions.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-colors ${
                  selectedPeriod === p
                    ? "bg-primary/10 text-primary border border-primary"
                    : "bg-card text-muted-foreground border border-border"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* AI 추천 Hero 카드 */}
        <div className="prediction-hero">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BrainCircuit className="w-4 h-4 text-white/70" />
              <span className="text-[11px] font-medium text-white/70">AI 추천 출하 시점</span>
            </div>
            <p className="text-2xl font-bold">11월 12일 <span className="text-base font-medium text-white/70">오전 경매</span></p>
            <p className="text-xs text-white/70 mt-1">
              고추(건고추) · 대구북부 · 20kg 기준
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-white/15 rounded-md px-3 py-2">
                <p className="text-[10px] text-white/60">현재가 → 예측가</p>
                <p className="text-sm font-bold">{currentPrice.toLocaleString()}원 → {predictedPrice.toLocaleString()}원</p>
              </div>
              <div className="bg-white/15 rounded-md px-3 py-2">
                <p className="text-[10px] text-white/60">예상 상승</p>
                <p className="text-sm font-bold">+{changePercent}%</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-md px-3 py-2.5 mt-2">
              <p className="text-[10px] text-white/60">출하량 {quantity}상자 기준 총 추가 수익</p>
              <p className="text-lg font-bold">+{diff.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* 최근 실시간 경매 기준 */}
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">최근 실시간 경매 기준</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">품목</span>
              <span className="font-medium text-foreground">고추(건고추)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">시장</span>
              <span className="font-medium text-foreground">대구북부</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">법인</span>
              <span className="font-medium text-foreground">효성청과(주)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">경매가</span>
              <span className="font-semibold text-foreground">8,500원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">단량 / 포장</span>
              <span className="font-medium text-foreground">20kg / 상자</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">수량</span>
              <span className="font-medium text-foreground">38</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">출하지</span>
              <span className="font-medium text-foreground">충북 충주시</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">거래 시각</span>
              <span className="font-medium text-foreground">11.09 15:20</span>
            </div>
          </div>
        </div>

        {/* 판매 시점 비교 */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2.5">출하 시점 비교</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-lg border border-border p-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">현재 시점 출하</p>
              <p className="text-lg font-bold text-foreground">{currentPrice.toLocaleString()}<span className="text-xs font-normal text-muted-foreground ml-0.5">원/20kg</span></p>
              <div className="mt-2 pt-2 border-t border-border space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">출하량</span>
                  <span className="text-foreground">{quantity}상자</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예상 매출</span>
                  <span className="font-semibold text-foreground">{currentTotal.toLocaleString()}원</span>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border-2 border-primary/30 p-3 relative">
              <div className="absolute -top-2 right-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">추천</div>
              <p className="text-[11px] font-semibold text-primary mb-2">11월 12일 출하</p>
              <p className="text-lg font-bold text-foreground">{predictedPrice.toLocaleString()}<span className="text-xs font-normal text-muted-foreground ml-0.5">원/20kg</span></p>
              <div className="mt-2 pt-2 border-t border-border space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">출하량</span>
                  <span className="text-foreground">{quantity}상자</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예상 매출</span>
                  <span className="font-semibold text-foreground">{predictedTotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between price-up font-semibold">
                  <span>추가 수익</span>
                  <span>+{diff.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 예측 차트 */}
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">{selectedPeriod} 가격 예측</span>
            <span className="text-[10px] text-muted-foreground">원 / 20kg</span>
          </div>
          <div className="flex items-center gap-3 mb-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-primary rounded-full inline-block" />실제가</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-success rounded-full inline-block" style={{ borderBottom: "1px dashed" }} />예측가</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-destructive/20 rounded-full inline-block" />추천일</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={predictionChartData}>
              <CartesianGrid stroke="hsl(214 20% 90%)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[7800, 9400]} tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(1)}천`} />
              <Tooltip
                contentStyle={{ backgroundColor: "white", border: "1px solid hsl(214 20% 90%)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: number | null, name: string) => {
                  if (value === null) return ["-", ""];
                  return [`${value.toLocaleString()}원`, name === "price" ? "실제가" : "예측가"];
                }}
              />
              <ReferenceLine x="11/9" stroke="hsl(215 12% 50%)" strokeDasharray="3 3" label={{ value: "오늘", position: "top", fontSize: 10, fill: "hsl(215 12% 50%)" }} />
              <Line type="monotone" dataKey="price" stroke="hsl(220 80% 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(220 80% 50%)" }} connectNulls={false} />
              <Line type="monotone" dataKey="predicted" stroke="hsl(152 60% 42%)" strokeWidth={2} strokeDasharray="5 3" dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.recommended) {
                  return <circle key={payload.date} cx={cx} cy={cy} r={6} fill="hsl(0 72% 55%)" fillOpacity={0.3} stroke="hsl(0 72% 55%)" strokeWidth={2} />;
                }
                if (payload.holiday) {
                  return <circle key={payload.date} cx={cx} cy={cy} r={3} fill="hsl(38 92% 55%)" stroke="hsl(38 92% 55%)" strokeWidth={1} />;
                }
                return <circle key={payload.date} cx={cx} cy={cy} r={3} fill="hsl(152 60% 42%)" />;
              }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" />11/11 시장 휴무</span>
            <span>· 점선은 AI 예측 가격</span>
          </div>
        </div>

        {/* 상승/주의 요인 */}
        <div className="space-y-3">
          <div className="bg-card rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold text-foreground">상승 요인</span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <span className="reason-badge reason-badge-up mt-0.5">반입</span>
                <span>최근 3일 반입량 감소 추세 (전주 대비 -12%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="reason-badge reason-badge-up mt-0.5">기상</span>
                <span>기온 하락으로 출하량 감소 예상</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="reason-badge reason-badge-up mt-0.5">시세</span>
                <span>대구북부 시장 최근 낙찰가 상승세 지속</span>
              </li>
            </ul>
          </div>
          <div className="bg-card rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs font-semibold text-foreground">주의 요인</span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <span className="reason-badge reason-badge-caution mt-0.5">변동</span>
                <span>거래량 감소 시 예측 변동성 확대 가능</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="reason-badge reason-badge-caution mt-0.5">법인</span>
                <span>효성청과 거래 편중 가능성 있음</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="reason-badge reason-badge-caution mt-0.5">휴무</span>
                <span>11/11 비거래일 인접 구간 주의</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 예측 근거 접힘/펼침 */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-3 py-3"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">이 예측은 어떻게 만들어졌나요?</span>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {!expanded && (
            <div className="px-3 pb-3 text-[11px] text-muted-foreground">
              기상 데이터, 과거 시세, 계절성 등 6개 요인 분석 기반
            </div>
          )}

          {expanded && (
            <div className="px-3 pb-4 space-y-3 animate-fade-in">
              <div className="space-y-2.5">
                {[
                  { icon: CloudRain, label: "기상 데이터", desc: "향후 2주간 기온, 강수량, 일조량 예보 분석" },
                  { icon: BarChart2, label: "과거 시세 패턴", desc: "최근 5년간 같은 시기 가격 변동 패턴 학습" },
                  { icon: TrendingUp, label: "생산·유통 데이터", desc: "산지 출하량, 도매시장 반입량 추이 반영" },
                  { icon: Calendar, label: "계절성 요인", desc: "설, 명절 수요 증가 등 계절 이벤트 반영" },
                  { icon: Building2, label: "시장·법인 데이터", desc: "대구북부 법인별 최근 거래 단가 추이 분석" },
                  { icon: MapPin, label: "산지별 출하 흐름", desc: "충북 충주 산지 출하 패턴 및 물량 예측" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed bg-secondary rounded-md px-3 py-2">
                ⚠ AI 예측은 참고용이며, 실제 시세는 다양한 요인에 의해 변동될 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
      <CropSheet open={cropOpen} onOpenChange={setCropOpen} />
      <MarketSheet open={marketOpen} onOpenChange={setMarketOpen} />
      <VarietySheet open={varietyOpen} onOpenChange={setVarietyOpen} />
      <QtySheet open={qtyOpen} onOpenChange={setQtyOpen} />
    </div>
  );
};

export default PredictionPage;
