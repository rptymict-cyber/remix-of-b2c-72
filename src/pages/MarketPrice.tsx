import { useState } from "react";
import { ChevronDown, ArrowUpRight, ArrowDownRight, Minus, SlidersHorizontal } from "lucide-react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area,
} from "recharts";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const chartData = [
  { date: "4/8", price: 48200, volume: 1120 },
  { date: "4/9", price: 49100, volume: 1050 },
  { date: "4/10", price: 50800, volume: 1180 },
  { date: "4/11", price: 51200, volume: 1260 },
  { date: "4/12", price: 50400, volume: 980 },
  { date: "4/13", price: 51800, volume: 1150 },
  { date: "4/14", price: 52400, volume: 1280 },
];

const marketData = [
  { name: "서울 가락", price: 52400, dayChange: 2.3, weekChange: 6.8, volume: 1280, share: 38.2 },
  { name: "부산 엄궁", price: 51800, dayChange: 1.8, weekChange: 5.2, volume: 860, share: 22.1 },
  { name: "대구 북부", price: 50200, dayChange: -0.5, weekChange: 4.1, volume: 640, share: 15.8 },
  { name: "대전 오정", price: 51400, dayChange: 2.1, weekChange: 7.2, volume: 420, share: 10.4 },
  { name: "광주 각화", price: 49800, dayChange: -1.2, weekChange: 3.5, volume: 380, share: 8.2 },
  { name: "안양", price: 50600, dayChange: 0.8, weekChange: 4.8, volume: 310, share: 5.3 },
];

const corporationData = [
  { name: "서울청과(주)", avgPrice: 52800, volume: 420, share: 32.8 },
  { name: "중앙청과(주)", avgPrice: 52200, volume: 380, share: 29.7 },
  { name: "한국청과(주)", avgPrice: 51600, volume: 280, share: 21.9 },
  { name: "동화청과(주)", avgPrice: 51200, volume: 200, share: 15.6 },
];

const originData = [
  { region: "충남 공주", share: 28.4, markets: "가락 42%, 안양 31%" },
  { region: "경북 안동", share: 22.1, markets: "가락 38%, 대구 35%" },
  { region: "전남 영광", share: 15.8, markets: "광주 52%, 가락 22%" },
  { region: "충북 청주", share: 12.3, markets: "대전 45%, 가락 28%" },
  { region: "경남 창녕", share: 8.7, markets: "부산 58%, 가락 18%" },
];

const varietyData = [
  { variety: "건고추(화건)", unit: "20kg", price: 52400, volume: 680 },
  { variety: "건고추(양건)", unit: "20kg", price: 48800, volume: 320 },
  { variety: "풋고추", unit: "10kg", price: 32600, volume: 180 },
  { variety: "청양고추", unit: "10kg", price: 38400, volume: 100 },
];

const analysisTabs = ["종합", "시장비교", "법인", "산지", "품종"];
const periodTabs = ["오늘", "1주", "1달", "3달", "1년"];

const ChangeIndicator = ({ value }: { value: number }) => {
  if (value > 0) return <span className="price-up text-xs font-semibold flex items-center"><ArrowUpRight className="w-3 h-3" />+{value}%</span>;
  if (value < 0) return <span className="price-down text-xs font-semibold flex items-center"><ArrowDownRight className="w-3 h-3" />{value}%</span>;
  return <span className="price-neutral text-xs font-semibold flex items-center"><Minus className="w-3 h-3" />0%</span>;
};

const MarketPricePage = () => {
  const [activeTab, setActiveTab] = useState("종합");
  const [activePeriod, setActivePeriod] = useState("1주");

  return (
    <div className="min-h-screen expert-bg">
      <AppHeader title="실시간 시세" variant="dark" showRefresh subtitle="2026.04.14 14:00 기준" />

      <main className="px-4 pt-3 pb-4 safe-bottom space-y-3">
        {/* 필터 바 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            "고추 ▾", "건고추 ▾", "전국 도매 ▾", "20kg ▾", "1주 ▾",
          ].map((label) => (
            <button key={label} className="filter-chip flex-shrink-0">
              {label}
            </button>
          ))}
          <button className="filter-chip flex-shrink-0 filter-chip-active">
            <SlidersHorizontal className="w-3 h-3" />
            필터
          </button>
        </div>

        {/* KPI 요약 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="kpi-card">
            <p className="text-[10px] expert-text-secondary">현재가</p>
            <p className="text-lg font-bold text-expert-text mt-0.5">52,400</p>
            <p className="text-[10px] expert-text-secondary">원/20kg</p>
          </div>
          <div className="kpi-card">
            <p className="text-[10px] expert-text-secondary">전일 대비</p>
            <p className="text-lg font-bold price-up mt-0.5">+2.3%</p>
            <p className="text-[10px] expert-text-secondary">+1,180원</p>
          </div>
          <div className="kpi-card">
            <p className="text-[10px] expert-text-secondary">거래량</p>
            <p className="text-lg font-bold text-expert-text mt-0.5">1,280</p>
            <p className="text-[10px] expert-text-secondary">톤</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="kpi-card">
            <p className="text-[10px] expert-text-secondary">전주 대비</p>
            <p className="text-sm font-bold price-up mt-0.5">+6.8%</p>
          </div>
          <div className="kpi-card">
            <p className="text-[10px] expert-text-secondary">전년 동기</p>
            <p className="text-sm font-bold price-up mt-0.5">+14.2%</p>
          </div>
          <div className="kpi-card">
            <p className="text-[10px] expert-text-secondary">반입량</p>
            <p className="text-sm font-bold text-expert-text mt-0.5">53,400</p>
            <p className="text-[10px] expert-text-secondary">상자</p>
          </div>
        </div>

        {/* 분석 탭 */}
        <div className="flex gap-4 border-b border-expert-border">
          {analysisTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`analysis-tab ${activeTab === tab ? "analysis-tab-active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 종합 탭 내용 */}
        {activeTab === "종합" && (
          <div className="space-y-3 animate-fade-in">
            {/* 기간 선택 */}
            <div className="flex gap-1.5">
              {periodTabs.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activePeriod === p
                      ? "bg-expert-accent/20 text-expert-accent"
                      : "text-expert-text-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* 복합 차트 */}
            <div className="expert-surface rounded-lg p-3 border border-expert-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs expert-text-secondary">가격(원) + 거래량(t)</span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-expert-accent rounded-full inline-block" />가격</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-expert-success/30 rounded-sm inline-block" />거래량</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={chartData}>
                  <CartesianGrid stroke="hsl(220 15% 20%)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 15% 58%)" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="price" domain={[46000, 54000]} tick={{ fontSize: 10, fill: "hsl(215 15% 58%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}천`} />
                  <YAxis yAxisId="volume" orientation="right" domain={[0, 1600]} tick={{ fontSize: 10, fill: "hsl(215 15% 58%)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(220 25% 12%)", border: "1px solid hsl(220 20% 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210 20% 92%)" }}
                    formatter={(value: number, name: string) => [name === "price" ? `${value.toLocaleString()}원` : `${value}t`, name === "price" ? "가격" : "거래량"]}
                  />
                  <Bar yAxisId="volume" dataKey="volume" fill="hsl(152 65% 50% / 0.2)" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="price" type="monotone" dataKey="price" stroke="hsl(210 85% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(210 85% 55%)" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 시장별 시세 테이블 */}
            <div className="expert-surface rounded-lg border border-expert-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-expert-border">
                <span className="text-xs font-semibold text-expert-text">시장별 시세</span>
                <button className="text-[10px] expert-accent flex items-center gap-0.5">
                  높은가격순 <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-expert-border">
                <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[10px] expert-text-secondary">
                  <span className="col-span-3">시장</span>
                  <span className="col-span-2 text-right">현재가</span>
                  <span className="col-span-2 text-right">전일</span>
                  <span className="col-span-2 text-right">전주</span>
                  <span className="col-span-1 text-right">거래</span>
                  <span className="col-span-2 text-right">점유</span>
                </div>
                {marketData.map((m) => (
                  <div key={m.name} className="grid grid-cols-12 gap-1 px-3 py-2.5 text-xs expert-surface-hover cursor-pointer">
                    <span className="col-span-3 font-medium text-expert-text truncate">{m.name}</span>
                    <span className="col-span-2 text-right font-semibold text-expert-text">{(m.price/10000).toFixed(1)}만</span>
                    <span className={`col-span-2 text-right font-medium ${m.dayChange > 0 ? "price-up" : m.dayChange < 0 ? "price-down" : "price-neutral"}`}>
                      {m.dayChange > 0 ? "+" : ""}{m.dayChange}%
                    </span>
                    <span className={`col-span-2 text-right font-medium ${m.weekChange > 0 ? "price-up" : "price-neutral"}`}>
                      +{m.weekChange}%
                    </span>
                    <span className="col-span-1 text-right expert-text-secondary">{m.volume >= 1000 ? `${(m.volume/1000).toFixed(1)}k` : m.volume}</span>
                    <span className="col-span-2 text-right expert-text-secondary">{m.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 시장비교 탭 */}
        {activeTab === "시장비교" && (
          <div className="space-y-3 animate-fade-in">
            <div className="expert-surface rounded-lg border border-expert-border overflow-hidden">
              <div className="px-3 py-2.5 border-b border-expert-border">
                <span className="text-xs font-semibold text-expert-text">시장별 가격 비교</span>
              </div>
              {marketData.map((m, i) => (
                <div key={m.name} className="px-3 py-3 border-b border-expert-border last:border-b-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-expert-text">{m.name}</span>
                    <span className="text-sm font-bold text-expert-text">{m.price.toLocaleString()}원</span>
                  </div>
                  <div className="w-full bg-expert-border rounded-full h-1.5">
                    <div className="bg-expert-accent rounded-full h-1.5" style={{ width: `${m.share * 2.5}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] expert-text-secondary">
                    <span>거래량 {m.volume}t · 점유율 {m.share}%</span>
                    <ChangeIndicator value={m.dayChange} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 법인 탭 */}
        {activeTab === "법인" && (
          <div className="space-y-3 animate-fade-in">
            <div className="expert-surface rounded-lg border border-expert-border overflow-hidden">
              <div className="px-3 py-2.5 border-b border-expert-border">
                <span className="text-xs font-semibold text-expert-text">법인청과별 거래 현황</span>
                <p className="text-[10px] expert-text-secondary mt-0.5">서울 가락시장 기준</p>
              </div>
              {corporationData.map((c) => (
                <div key={c.name} className="px-3 py-3 border-b border-expert-border last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-expert-text">{c.name}</span>
                    <span className="text-sm font-bold text-expert-text">{c.avgPrice.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] expert-text-secondary">
                    <span>거래량 {c.volume}t</span>
                    <span>점유율 {c.share}%</span>
                  </div>
                  <div className="w-full bg-expert-border rounded-full h-1 mt-1.5">
                    <div className="bg-expert-accent rounded-full h-1" style={{ width: `${c.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 산지 탭 */}
        {activeTab === "산지" && (
          <div className="space-y-3 animate-fade-in">
            <div className="expert-surface rounded-lg border border-expert-border overflow-hidden">
              <div className="px-3 py-2.5 border-b border-expert-border">
                <span className="text-xs font-semibold text-expert-text">주요 출하 산지</span>
                <p className="text-[10px] expert-text-secondary mt-0.5">고추(건고추) 기준 전국 도매시장</p>
              </div>
              {originData.map((o) => (
                <div key={o.region} className="px-3 py-3 border-b border-expert-border last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-expert-text">{o.region}</span>
                    <span className="text-sm font-semibold expert-accent">{o.share}%</span>
                  </div>
                  <p className="text-[10px] expert-text-secondary mt-1">
                    주요 출하처: {o.markets}
                  </p>
                </div>
              ))}
            </div>
            <div className="expert-surface rounded-lg border border-expert-border p-3">
              <p className="text-[11px] text-expert-text">
                <span className="expert-accent font-semibold">내 지역 인사이트</span>
              </p>
              <p className="text-xs expert-text-secondary mt-1 leading-relaxed">
                충남 공주산 고추는 주로 서울 가락시장(42%), 안양시장(31%), 대전 오정(12%)으로 출하됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 품종 탭 */}
        {activeTab === "품종" && (
          <div className="space-y-3 animate-fade-in">
            <div className="expert-surface rounded-lg border border-expert-border overflow-hidden">
              <div className="px-3 py-2.5 border-b border-expert-border">
                <span className="text-xs font-semibold text-expert-text">품종 · 단량별 가격</span>
              </div>
              <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[10px] expert-text-secondary border-b border-expert-border">
                <span className="col-span-4">품종</span>
                <span className="col-span-2 text-right">단량</span>
                <span className="col-span-3 text-right">평균가</span>
                <span className="col-span-3 text-right">거래량(t)</span>
              </div>
              {varietyData.map((v) => (
                <div key={v.variety} className="grid grid-cols-12 gap-1 px-3 py-2.5 text-xs border-b border-expert-border last:border-b-0">
                  <span className="col-span-4 font-medium text-expert-text">{v.variety}</span>
                  <span className="col-span-2 text-right expert-text-secondary">{v.unit}</span>
                  <span className="col-span-3 text-right font-semibold text-expert-text">{v.price.toLocaleString()}</span>
                  <span className="col-span-3 text-right expert-text-secondary">{v.volume}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav variant="dark" />
    </div>
  );
};

export default MarketPricePage;
