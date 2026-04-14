import { ChevronRight, MapPin, CloudSun, TrendingUp, BrainCircuit, ArrowUpRight, BarChart3, Store, Sprout, Plus, User } from "lucide-react";
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

      <main className="px-4 pt-6 pb-4 safe-bottom space-y-6">
        {/* 사용자 인사 카드 */}
        <section className="bg-gradient-to-br from-[#e6f4ea] to-[#d4edda] rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#5a8a6a]">안녕하세요,</p>
              <p className="text-xl font-bold text-[#1a3c2a] mt-0.5">홍길동님</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#b8d8c4] flex items-center justify-center">
              <User className="w-6 h-6 text-[#5a8a6a]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-sm text-[#5a8a6a]">
            <CloudSun className="w-4 h-4" />
            <span>충남 공주시</span>
            <span className="text-[#a0c8b0] mx-1">|</span>
            <span>대체로 맑음 22°</span>
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
          className="bg-card rounded-lg border border-border shadow-[var(--shadow-sm)] overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="bg-primary/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">고추 · 서울 가락시장 · 건고추</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-foreground">52,400</span>
                  <span className="text-sm text-muted-foreground">원/20kg</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="price-up text-sm font-semibold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +2.3%
                </span>
                <span className="text-[10px] text-muted-foreground">전일 대비</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>전주 <span className="price-up font-medium">+6.8%</span></span>
              <span className="text-border">|</span>
              <span>전년 <span className="price-up font-medium">+14.2%</span></span>
              <span className="text-border">|</span>
              <span>거래량 1,280t</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <div className="px-4 pb-2 text-[10px] text-muted-foreground/60">
            2026.04.14 14:00 업데이트
          </div>
        </section>

        {/* AI 가격 예측 요약 */}
        <section
          onClick={() => navigate("/prediction")}
          className="prediction-hero cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <BrainCircuit className="w-4 h-4 text-white/80" />
              <span className="text-xs font-medium text-white/80">AI 출하 시점 예측</span>
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
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
          </div>
        </section>

        {/* 핵심 기능 진입 */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2.5">무엇을 알고 싶으세요?</h2>
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
                <div className="flex items-center justify-between mb-3">
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
