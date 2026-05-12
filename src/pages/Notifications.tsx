import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Bell, ChevronRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

type Cat = "전체" | "가격 알림" | "AI 예측" | "시스템";

const items = [
  { cat: "가격 알림", emoji: "🔴", title: "🌶️ 고추(건고추) 가격 급등", body: "전일 대비 +12.3% 상승\n45,200원 → 50,800원 (20kg)", time: "방금 전", route: "/market" },
  { cat: "AI 예측", emoji: "🟢", title: "🌶️ 최적 출하 시점 업데이트", body: "기상 변화 반영 → 5월 12일 출하 추천", time: "2시간 전", route: "/prediction" },
  { cat: "시스템", emoji: "🟡", title: "서울 가락시장 5월 11일 휴장", body: "출하 계획을 조정해 주세요", time: "어제", route: "/sales" },
  { cat: "AI 예측", emoji: "🟢", title: "🍎 사과(후지) 30일 예측 갱신", body: "낙관 시나리오 +6.2% / 비관 -2.1%", time: "어제", route: "/prediction" },
  { cat: "가격 알림", emoji: "🔴", title: "🥬 배추 가격 -8.4% 하락", body: "공급 증가로 단기 조정", time: "2일 전", route: "/market" },
] as const;

const Notifications = () => {
  const nav = useNavigate();
  const [cat, setCat] = useState<Cat>("전체");
  const list = cat === "전체" ? items : items.filter((i) => i.cat === cat);
  return (
    <div className="h-full bg-background">
      <AppHeader title="알림" variant="back" rightAction={
        <button onClick={() => nav("/notification-settings")} className="text-muted-foreground"><Settings className="w-5 h-5" /></button>
      } />
      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+1rem)] safe-bottom space-y-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {(["전체", "가격 알림", "AI 예측", "시스템"] as Cat[]).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${cat === c ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
            >{c}</button>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">아직 알림이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((it, i) => (
              <button
                key={i}
                onClick={() => nav(it.route)}
                className="w-full text-left bg-card border border-border rounded-2xl p-4 pr-10 relative active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-muted-foreground">{it.emoji} [{it.cat}] · {it.time}</span>
                </div>
                <p className="text-sm font-bold text-foreground">{it.title}</p>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">{it.body}</p>
                <ChevronRight className="w-5 h-5 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2" />
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};
export default Notifications;