import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "/", label: "홈", icon: HomeIcon },
  { id: "/market", label: "시세", icon: TrendIcon },
  { id: "/prediction", label: "예측", icon: ChartIcon },
  { id: "/sales", label: "판매처", icon: LocationIcon },
  { id: "/crop", label: "작물", icon: SproutIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" />
    </svg>
  );
}

function TrendIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 16 8 12 12 14 20 6" />
      <polyline points="16 6 20 6 20 10" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 18 8 10 12 14 16 8 20 12" />
      <line x1="4" y1="20" x2="4" y2="6" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  );
}

function LocationIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    </svg>
  );
}

function SproutIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" />
      <path d="M12 20v-8" />
      <path d="M12 12C12 8 9 5 5 5c0 4 3 7 7 7z" />
      <path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7z" />
    </svg>
  );
}

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/prediction") return location.pathname.startsWith("/prediction");
    return location.pathname === path;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-[430px] bg-white"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -2px 12px rgba(17, 24, 39, 0.06)",
        borderTop: "1px solid hsl(220 13% 94%)",
      }}
    >
      <div className="flex items-stretch justify-between gap-1 h-[72px] w-full px-3 pt-2 pb-2">
        {tabs.map((tab) => {
          const active = isActive(tab.id);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 rounded-2xl transition-colors ${
                active
                  ? "bg-[hsl(150_55%_94%)] text-[hsl(150_55%_38%)]"
                  : "text-[hsl(220_8%_55%)]"
              }`}
            >
              <Icon active={active} />
              <span
                className={`text-[11px] leading-none ${
                  active ? "font-bold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
