import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Crown, Check } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import MarketSheet from "@/components/sheets/MarketSheet";
import UnitSheet from "@/components/sheets/UnitSheet";
import { useApp, UserType } from "@/store/appStore";
import { findCrop, findMarket } from "@/data/catalog";

const USER_TYPE_DISPLAY: Record<Exclude<UserType, null> | "none", { icon: string; name: string; desc: string }> = {
  farmer: { icon: "👨‍🌾", name: "농민 · 농업법인", desc: "출하 시점 추천 + 내 작물 시세 중심 화면" },
  wholesaler: { icon: "🏪", name: "도매상 · 중도매인", desc: "반입량·낙찰가·법인 중심 화면" },
  retailer: { icon: "🛒", name: "소매상 · 마트 바이어", desc: "매입 적정가·도소매 가격차 중심 화면" },
  enterprise: { icon: "🏢", name: "식품기업 · 유통업체", desc: "수급 동향·중기 예측 중심 화면" },
  none: { icon: "🌱", name: "유형 미설정", desc: "유형을 선택하면 맞춤 화면을 보여드려요" },
};

const USER_TYPE_OPTIONS: { id: Exclude<UserType, null>; icon: string; title: string; desc: string; tags: string[] }[] = [
  { id: "farmer", icon: "👨‍🌾", title: "농민 · 농업법인", desc: "내 작물을 직접 재배하고 판매해요", tags: ["출하 시점 추천", "내 작물 시세", "수익 시뮬레이션"] },
  { id: "wholesaler", icon: "🏪", title: "도매상 · 중도매인", desc: "시장에서 농산물을 사고 팔아요", tags: ["반입량·낙찰가", "산지별 시세", "법인 비교"] },
  { id: "retailer", icon: "🛒", title: "소매상 · 마트 바이어", desc: "농산물을 매입해서 소비자에게 판매해요", tags: ["도소매 가격차", "매입 적정가", "가격 경보"] },
  { id: "enterprise", icon: "🏢", title: "식품기업 · 유통업체", desc: "대량 조달 전략과 수급 분석이 필요해요", tags: ["공급량 동향", "산지 분석", "중기 예측"] },
];

const Row = ({ label, value, onClick, danger }: { label: string; value?: string; onClick?: () => void; danger?: boolean }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between py-3.5 min-h-11">
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

const UserTypeSheet = ({
  open,
  onOpenChange,
  selected,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selected: UserType;
  onSelect: (t: Exclude<UserType, null>) => void;
}) => (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent>
      <div className="flex flex-col h-full min-h-0 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
        <h3 className="text-base font-bold text-foreground text-center mb-1 shrink-0">내 유형 선택</h3>
        <p className="text-[12px] text-muted-foreground text-center mb-3 shrink-0">유형에 맞춰 화면 구성이 달라져요.</p>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {USER_TYPE_OPTIONS.map((opt) => {
            const sel = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all ${
                  sel ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{opt.title}</p>
                      {sel && (
                        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {opt.tags.map((t) => (
                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </DrawerContent>
  </Drawer>
);

const UNIT_OPTIONS = [
  { kg: 1, label: "원/kg" },
  { kg: 10, label: "원/10kg" },
  { kg: 20, label: "원/20kg" },
  { kg: 0, label: "원/상자" },
];

const BasicUnitSheet = ({
  open,
  onOpenChange,
  selectedKg,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selectedKg: number;
  onSelect: (kg: number) => void;
}) => (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent>
      <div className="flex flex-col h-full min-h-0 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
        <h3 className="text-base font-bold text-foreground text-center mb-3 shrink-0">기본 단위 선택</h3>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {UNIT_OPTIONS.map((opt) => {
            const sel = selectedKg === opt.kg;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  onSelect(opt.kg);
                  onOpenChange(false);
                }}
                className={`w-full min-h-12 flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 ${
                  sel ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <span className={`text-[14px] font-bold ${sel ? "text-primary" : "text-foreground"}`}>{opt.label}</span>
                {sel && <Check className="w-4 h-4 text-primary" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    </DrawerContent>
  </Drawer>
);

const MyPage = () => {
  const nav = useNavigate();
  const { profile, setProfile, marketId, unitKg, setUnitKg, notif } = useApp();
  const initials = profile.name.slice(0, 1) || "농";
  const myCropsLabel = profile.myCrops.map((id) => `${findCrop(id).emoji}${findCrop(id).name}`).join(", ") || "선택 없음";

  const userTypeKey = profile.userType ?? "none";
  const userTypeInfo = USER_TYPE_DISPLAY[userTypeKey as keyof typeof USER_TYPE_DISPLAY];

  const [userTypeOpen, setUserTypeOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  const unitLabel =
    unitKg === 1 ? "원/kg" : unitKg === 10 ? "원/10kg" : unitKg === 20 ? "원/20kg" : `원/${unitKg}kg`;

  return (
    <div className="h-full bg-background">
      <AppHeader title="마이" />
      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+1rem)] safe-bottom space-y-3">
        {/* 내 유형 */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground mb-2.5">내 유형</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-2xl shrink-0">
              {userTypeInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{userTypeInfo.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{userTypeInfo.desc}</p>
            </div>
            <button
              onClick={() => setUserTypeOpen(true)}
              className="shrink-0 min-h-11 px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold"
            >
              변경
            </button>
          </div>
        </section>

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
          <button onClick={() => setProfile({ plan: "Basic" })} className="w-full mt-3 py-2.5 rounded-xl bg-primary text-white text-xs font-bold min-h-11">
            업그레이드
          </button>
        </section>

        <Section title="내 농장 정보">
          <Row label="농장 위치" value={profile.region} onClick={() => nav("/farm-edit")} />
          <Row label="농장 규모" value={`${profile.farmSize} (${profile.farmAreaM2.toLocaleString()}㎡)`} onClick={() => nav("/farm-edit")} />
          <Row label="재배 작물" value={myCropsLabel} onClick={() => nav("/farm-edit")} />
        </Section>

        <Section title="앱 설정">
          <Row label="기본 단위" value={unitLabel} onClick={() => setUnitOpen(true)} />
          <Row label="기본 시장" value={findMarket(marketId).name} onClick={() => setMarketOpen(true)} />
          <Row label="알림 설정" value={notif.priceAlert ? "켜짐" : "꺼짐"} onClick={() => nav("/notification-settings")} />
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

      <UserTypeSheet
        open={userTypeOpen}
        onOpenChange={setUserTypeOpen}
        selected={profile.userType ?? null}
        onSelect={(t) => {
          setProfile({ userType: t });
          setUserTypeOpen(false);
        }}
      />
      <BasicUnitSheet
        open={unitOpen}
        onOpenChange={setUnitOpen}
        selectedKg={unitKg}
        onSelect={(kg) => setUnitKg(kg)}
      />
      <MarketSheet open={marketOpen} onOpenChange={setMarketOpen} />
    </div>
  );
};
export default MyPage;
