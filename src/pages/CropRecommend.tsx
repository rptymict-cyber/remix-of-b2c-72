import { useState } from "react";
import { ChevronDown, ChevronUp, Sprout, TrendingUp, Shield, AlertTriangle, BarChart2, ThermometerSun, FileText } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const cropData = [
  {
    name: "양파",
    emoji: "🧅",
    profitability: "높음",
    profitScore: 85,
    risk: "보통",
    riskScore: 45,
    volatility: "보통",
    regionFit: "높음",
    reason: "최근 가격 흐름이 안정적이며 지역 기후 적합도가 높습니다",
    details: ["최근 6개월 평균 가격 상승세 유지", "충남 지역 재배 적합도 상위 10%", "생산비 대비 수익률 우수"],
    recommended: true,
  },
  {
    name: "배추",
    emoji: "🥬",
    profitability: "높음",
    profitScore: 78,
    risk: "높음",
    riskScore: 72,
    volatility: "큼",
    regionFit: "높음",
    reason: "수익 기대치가 높으나 가격 변동성이 커 주의가 필요합니다",
    details: ["김장 시즌 수요 급증 예상", "공급 과잉 시 급락 리스크 존재", "재배 기간 대비 수익률 높음"],
    recommended: false,
  },
  {
    name: "무",
    emoji: "🥕",
    profitability: "보통",
    profitScore: 62,
    risk: "낮음",
    riskScore: 28,
    volatility: "작음",
    regionFit: "높음",
    reason: "안정적인 수익을 원한다면 적합한 작물입니다",
    details: ["가격 변동폭이 적어 예측 안정적", "배추와 윤작 시 효율 극대화", "수요가 꾸준한 기본 채소류"],
    recommended: false,
  },
  {
    name: "감자",
    emoji: "🥔",
    profitability: "보통",
    profitScore: 58,
    risk: "보통",
    riskScore: 40,
    volatility: "보통",
    regionFit: "보통",
    reason: "봄 재배 시 수익 안정적이나 지역 적합도가 다소 낮습니다",
    details: ["봄감자 시세가 비교적 양호", "충남 지역 기후 조건 보통", "저장성 우수하여 출하 시점 유연"],
    recommended: false,
  },
];

const CropRecommendPage = () => {
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);

  const levelColor = (level: string) => {
    if (level === "높음" || level === "큼") return "text-red-500";
    if (level === "보통") return "text-amber-500";
    return "text-green-600";
  };

  const profitColor = (level: string) => {
    if (level === "높음") return "text-green-600";
    if (level === "보통") return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="작물 추천" subtitle="다음 시즌 재배 계획" />

      <main className="px-4 pt-5 safe-bottom space-y-4">
        {/* 조건 */}
        <div className="flex flex-wrap gap-2.5">
          {[
            { label: "충남 공주", icon: true },
            { label: "노지", icon: true },
            { label: "다음 시즌", icon: true },
            { label: "1,200평", icon: true },
          ].map((chip) => (
            <button key={chip.label} className="filter-chip">
              {chip.label}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* 추천 카드 */}
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sprout className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">AI 추천 작물</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧅</span>
            <div>
              <p className="text-xl font-bold text-foreground">양파</p>
              <p className="text-xs text-muted-foreground">예상 수익성 높음 · 가격 변동성 보통</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">수익성</p>
              <p className="text-xs font-bold text-green-600">높음</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">리스크</p>
              <p className="text-xs font-bold text-amber-500">보통</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">지역 적합도</p>
              <p className="text-xs font-bold text-green-600">높음</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            최근 가격 흐름이 안정적이며 지역 기후와 재배 적합도가 높습니다. 생산비 대비 수익성이 상대적으로 우수합니다.
          </p>
        </div>

        {/* 작물 랭킹 */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">추천 작물 비교</span>
          <span className="text-[10px] text-muted-foreground">수익 · 리스크 종합 평가</span>
        </div>

        <div className="space-y-2">
          {cropData.map((crop, idx) => (
            <div key={crop.name} className={`bg-card rounded-xl border p-3 ${crop.recommended ? "border-primary/30" : "border-border"} relative`}>
              {crop.recommended && (
                <div className="absolute -top-2 right-3 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">추천</div>
              )}
              <button
                className="w-full text-left"
                onClick={() => setExpandedCrop(expandedCrop === crop.name ? null : crop.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{crop.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{crop.name}</p>
                      <p className="text-[10px] text-muted-foreground">{crop.reason}</p>
                    </div>
                  </div>
                  {expandedCrop === crop.name ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>

                {/* 수익/리스크 바 */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10">수익</span>
                    <div className="flex-1 bg-secondary rounded-full h-1.5">
                      <div className="bg-green-500 rounded-full h-1.5" style={{ width: `${crop.profitScore}%` }} />
                    </div>
                    <span className={`text-[10px] font-semibold w-8 text-right ${profitColor(crop.profitability)}`}>{crop.profitability}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10">리스크</span>
                    <div className="flex-1 bg-secondary rounded-full h-1.5">
                      <div className="bg-red-400 rounded-full h-1.5" style={{ width: `${crop.riskScore}%` }} />
                    </div>
                    <span className={`text-[10px] font-semibold w-8 text-right ${levelColor(crop.risk)}`}>{crop.risk}</span>
                  </div>
                </div>
              </button>

              {expandedCrop === crop.name && (
                <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">변동성</span>
                      <span className={`font-medium ${levelColor(crop.volatility)}`}>{crop.volatility}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">지역 적합도</span>
                      <span className={`font-medium ${profitColor(crop.regionFit)}`}>{crop.regionFit}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {crop.details.map((d) => (
                      <div key={d} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-primary mt-0.5">•</span>
                        <span className="text-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 분석 기반 */}
        <div className="bg-card rounded-xl border border-border p-3">
          <p className="text-xs font-semibold text-foreground mb-2">추천 분석 기반</p>
          <div className="space-y-2">
            {[
              { icon: BarChart2, label: "장기 가격 흐름", desc: "최근 3년간 시세 변동 패턴 분석" },
              { icon: ThermometerSun, label: "지역 기후 적합성", desc: "충남 공주 기온·강수 조건 반영" },
              { icon: TrendingUp, label: "생산비 · 수익률", desc: "주요 작물별 비용 대비 수익 비교" },
              { icon: FileText, label: "정책 · 수급 동향", desc: "농업 정책 및 수급 전망 보고서 반영" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 주의 */}
        <div className="bg-secondary/50 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-0.5">참고 안내</p>
            <p>추천 결과는 과거 데이터와 통계 모델 기반의 참고 정보이며, 실제 재배 결정은 개별 농가 상황에 맞게 판단해주세요.</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default CropRecommendPage;
