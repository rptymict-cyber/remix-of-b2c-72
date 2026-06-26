import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "/", label: "홈", icon: HomeIcon },
  { id: "/market", label: "시세", icon: TrendIcon },
  { id: "/watchlist", label: "관심", icon: StarIcon },
  { id: "/mypage", label: "마이", icon: PersonIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" />
    </svg>
  );
}

function TrendIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 16 8 12 12 14 20 6" />
      <polyline points="16 6 20 6 20 10" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2.7 14.9 9 21.6 9.7 16.5 14.3 18 21 12 17.5 6 21 7.5 14.3 2.4 9.7 9.1 9" />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    const p = location.pathname;
    if (path === "/") return p === "/";
    if (path === "/market") return p === "/market";
    if (path === "/search") return p === "/search";
    if (path === "/watchlist") return p === "/watchlist" || p.startsWith("/crop");
    if (path === "/mypage") {
      return (
        p === "/mypage" ||
        p === "/notifications" ||
        p === "/notification-settings" ||
        p === "/farm-edit"
      );
    }
    return false;
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
      <div className="flex items-stretch justify-between gap-0.5 h-[68px] w-full px-2 pt-1.5 pb-1.5">
        {tabs.map((tab) => {
          const active = isActive(tab.id);
          const Icon = tab.icon;
          const target = tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(target)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 rounded-2xl transition-colors ${
                active
                  ? "bg-[hsl(150_55%_94%)] text-[hsl(150_55%_38%)]"
                  : "text-[hsl(220_8%_55%)]"
              }`}
            >
              <Icon active={active} />
              <span
                className={`text-[10.5px] leading-none ${
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
