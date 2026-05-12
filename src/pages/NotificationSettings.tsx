import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { Switch } from "@/components/ui/switch";

const Row = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3.5">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
    </div>
    {children}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-card border border-border rounded-2xl px-4 divide-y divide-border">
    <h3 className="text-xs font-bold text-muted-foreground py-3">{title}</h3>
    {children}
  </section>
);

const NotificationSettings = () => {
  const { notif, setNotif } = useApp();
  return (
    <div className="h-full bg-background">
      <AppHeader title="알림 설정" variant="back" />
      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+1rem)] safe-bottom space-y-3">
        <Section title="가격 알림">
          <Row label="가격 급등락 알림" desc={`±${notif.priceThreshold}% 변동 시 푸시`}>
            <Switch checked={notif.priceAlert} onCheckedChange={(v) => setNotif({ priceAlert: v })} />
          </Row>
          <Row label="임계값" desc="기본 ±10%">
            <input
              type="number"
              min={1}
              max={50}
              value={notif.priceThreshold}
              onChange={(e) => setNotif({ priceThreshold: Number(e.target.value) })}
              className="w-16 px-2 py-1 text-sm text-right rounded-lg border border-border bg-background"
            />
          </Row>
        </Section>
        <Section title="예측 알림">
          <Row label="AI 예측 업데이트"><Switch checked={notif.forecastUpdate} onCheckedChange={(v) => setNotif({ forecastUpdate: v })} /></Row>
          <Row label="추천 출하일 D-3 알림"><Switch checked={notif.shipD3} onCheckedChange={(v) => setNotif({ shipD3: v })} /></Row>
          <Row label="추천 출하일 D-1 알림"><Switch checked={notif.shipD1} onCheckedChange={(v) => setNotif({ shipD1: v })} /></Row>
        </Section>
        <Section title="시장 알림">
          <Row label="시장 휴무일 사전 안내"><Switch checked={notif.marketHoliday} onCheckedChange={(v) => setNotif({ marketHoliday: v })} /></Row>
          <Row label="안내 시점" desc={`${notif.holidayLeadDays}일 전`}>
            <div className="flex bg-secondary rounded-lg p-0.5">
              {[1, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setNotif({ holidayLeadDays: d as 1 | 3 })}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${notif.holidayLeadDays === d ? "bg-white text-foreground" : "text-muted-foreground"}`}
                >{d}일 전</button>
              ))}
            </div>
          </Row>
        </Section>
      </main>
      <BottomNav />
    </div>
  );
};
export default NotificationSettings;