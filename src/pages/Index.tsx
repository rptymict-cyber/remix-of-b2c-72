import { ChevronRight, CloudSun, BrainCircuit, ArrowUpRight, BarChart3, Store, Sprout, Plus, Clock, Droplets, Wind, Thermometer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const crops = [
  { name: "고추", emoji: "🌶️", active: true },
  { name: "배추", emoji: "🥬", active: false },
  { name: "양파", emoji: "🧅", active: false },
  { name: "마늘", emoji: "🧄", active: false },
  { name: "상추", emoji: "🥗", active: false },
  { name: "당근", emoji: "🥕", active: false },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="농산물 시세" />

      <main className="px-4 pt-6 safe-bottom space-y-6">
        {/* 사용자 인사 카드 */}
        <section className="bg-[#2d5a3d] rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white/60 tracking-wide">내 재배 기준 지역</p>
              <p className="text-[22px] font-bold mt-1 leading-tight">충남 공주시</p>
              <p className="text-[11px] text-white/50 mt-1.5">오늘 기준 시세 · 향후 10일 기상 반영 중</p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 ml-4">
              <CloudSun className="w-8 h-8 text-white/80 mb-1" />
              <p className="text-[28px] font-bold leading-none">14°C</p>
              <p className="text-[11px] text-white/60 mt-1">맑음</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-medium text-white/90">
              <Thermometer className="w-3 h-3" />
              주간 최저 2°C 예상
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-medium text-white/90">
              <Droplets className="w-3 h-3" />
              3일 후 강수
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f59e0b]/20 text-[10px] font-medium text-[#fbbf24]">
              <Wind className="w-3 h-3" />
              출하 영향 주의
            </span>
          </div>
        </section>

        {/* 작물 선택 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-foreground">관심 작물</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary text-primary text-xs font-medium">
              <Plus className="w-3.5 h-3.5" />
              작물 추가
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide items-center">
            {crops.map((crop) =>
              crop.active ? (
                <button
                  key={crop.name}
                  className="flex-shrink-0 flex items-center gap-2 pl-2.5 pr-5 py-2.5 rounded-full bg-[#2d5a3d] text-white text-sm font-semibold"
                >
                  <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">{crop.emoji}</span>
                  {crop.name}
                </button>
              ) : (
                <button
                  key={crop.name}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                >
                  <span className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-2xl">{crop.emoji}</span>
                </button>
              )
            )}
          </div>
        </section>

        {/* 대표 시세 요약 */}
        <section
          onClick={() => navigate("/market")}
          className="bg-card rounded-2xl border border-border shadow-[var(--shadow-md)] overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        >
          {/* 메인 시세 영역 */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground tracking-wide">
                  고추 · 건고추 · 서울 가락시장
                </p>
                <div className="flex items-baseline gap-1.5 mt-2.5">
                  <span className="text-[34px] font-extrabold text-foreground leading-none tracking-tight">52,400</span>
                  <span className="text-[13px] font-medium text-muted-foreground">원/20kg</span>
                </div>
              </div>
              {/* 우측: 전일 대비 + 네비 */}
              <div className="flex flex-col items-end gap-1 pt-0.5 flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                <div className="flex items-center gap-1 mt-1 px-2.5 py-1 rounded-lg bg-[hsl(0_72%_50%/0.07)]">
                  <ArrowUpRight className="w-3.5 h-3.5 price-up" />
                  <span className="text-[13px] font-bold price-up">+2.3%</span>
                </div>
                <span className="text-[10px] text-muted-foreground">전일 대비</span>
              </div>
            </div>
          </div>

          {/* 보조 지표 */}
          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-background rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground leading-tight">전주</p>
                <p className="text-[15px] font-bold price-up mt-1 leading-tight">+6.8%</p>
              </div>
              <div className="bg-background rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground leading-tight">전년</p>
                <p className="text-[15px] font-bold price-up mt-1 leading-tight">+14.2%</p>
              </div>
              <div className="bg-background rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground leading-tight">거래량</p>
                <p className="text-[15px] font-bold text-foreground mt-1 leading-tight">1,280t</p>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="border-t border-border/60 px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <Clock className="w-3 h-3" />
              <span>2026.04.14 14:00 업데이트</span>
            </div>
            <span className="text-[10px] text-muted-foreground/70">반입량 53,400상자</span>
          </div>
        </section>

        {/* AI 가격 예측 요약 */}
        <section
          onClick={() => navigate("/prediction")}
          className="prediction-hero cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-white/80" />
                <span className="text-xs font-medium text-white/80">AI 출하 시점 예측</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-xl font-bold">
              4월 24일 출하 시 유리
            </p>
            <p className="text-sm text-white/70 mt-1">
              현재 대비 <span className="text-white font-semibold">+7.8%</span> 상승 예상
            </p>
            <div className="mt-3 bg-white/15 rounded-md px-3 py-2">
              <p className="text-xs text-white/80 leading-relaxed">
                향후 10일간 기온 하락에 따른 출하량 감소로 상승 후 조정 가능성이 있어, 4월 24일 출하가 유리합니다.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-white/50">기상 + 시세 패턴 분석 기반</span>
            </div>
          </div>
        </section>

        {/* 핵심 기능 진입 */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2.5">핵심 기능 바로가기</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BarChart3, title: "시세 조회", desc: "현재 시장 시세 확인", color: "bg-primary/10", iconColor: "text-primary", route: "/market" },
              { icon: BrainCircuit, title: "가격 예측", desc: "AI 기반\n판매 시점 분석", color: "bg-accent/10", iconColor: "text-accent", route: "/prediction" },
              { icon: Store, title: "판매 시장 추천", desc: "최적 판매처 및\n시장 비교", color: "bg-warning/10", iconColor: "text-warning", route: "/sales" },
              { icon: Sprout, title: "다음 작물 추천", desc: "수익성 기반\n다음 재배 작물 추천", color: "bg-success/10", iconColor: "text-success", route: "/crop" },
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => item.route && navigate(item.route)}
                className="bg-card rounded-lg border border-border p-4 text-left shadow-[var(--shadow-sm)] active:scale-[0.98] transition-transform relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-full ${item.color} flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-line leading-relaxed">{item.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default HomePage;
