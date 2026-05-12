import { useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, Crown } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { findCrop } from "@/data/catalog";

const Row = ({ label, value, onClick, danger }: { label: string; value?: string; onClick?: () => void; danger?: boolean }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between py-3.5">
    <span className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</span>
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {value}
      <ChevronRight className="w-4 h-4" />
    </span>
  </button>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-card border border-border rounded-2xl px-4 divide-y divide-border">
    <h3 className="text-xs font-bold text-muted-foreground py-3">{title}</h3>
    {children}
  </section>
);

const MyPage = () => {
  const nav = useNavigate();
  const { profile, setProfile } = useApp();
  const initials = profile.name.slice(0, 1) || "농";
  const myCropsLabel = profile.myCrops.map((id) => `${findCrop(id).emoji}${findCrop(id).name}`).join(", ") || "선택 없음";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="마이페이지" variant="back" />
      <main className="px-4 pt-4 safe-bottom space-y-3">
        {/* Profile */}
        <section className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">{initials}</div>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">{profile.name} 농부님</p>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.region} · 가입일 2026.03.15</p>
          </div>
        </section>

        {/* Plan */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary">현재 플랜</span>
            </div>
            <span className="text-sm font-bold text-foreground">{profile.plan}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Basic 4,900원/월 · 일부 작물 예측 + 알림 + 30일 예측</p>
          <button onClick={() => setProfile({ plan: "Basic" })} className="w-full mt-3 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">
            업그레이드
          </button>
        </section>

        <Section title="내 농장 정보">
          <Row label="농장 위치" value={profile.region} onClick={() => nav("/farm-edit")} />
          <Row label="농장 규모" value={`${profile.farmSize} (${profile.farmAreaM2.toLocaleString()}㎡)`} onClick={() => nav("/farm-edit")} />
          <Row label="재배 작물" value={myCropsLabel} onClick={() => nav("/farm-edit")} />
        </Section>

        <Section title="알림 설정">
          <Row label="알림 환경설정" onClick={() => nav("/notification-settings")} />
        </Section>

        <Section title="앱 정보">
          <Row label="앱 버전" value="v1.0.0" />
        </Section>

        <Section title="계정">
          <Row label="로그아웃" danger onClick={() => { localStorage.removeItem("farminsight-app"); nav("/onboarding"); }} />
          <Row label="회원 탈퇴" danger />
        </Section>
      </main>
      <BottomNav />
    </div>
  );
};
export default MyPage;