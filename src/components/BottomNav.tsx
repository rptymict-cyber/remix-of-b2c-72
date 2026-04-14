import { Home, TrendingUp, BrainCircuit, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "/", label: "홈", icon: Home },
  { id: "/market", label: "시세", icon: TrendingUp },
  { id: "/prediction", label: "예측", icon: BrainCircuit },
  { id: "/more", label: "더보기", icon: MoreHorizontal, muted: true },
];

interface BottomNavProps {
  variant?: "light" | "dark";
}

const BottomNav = ({ variant = "light" }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/prediction") return location.pathname.startsWith("/prediction");
    return location.pathname === path;
  };

  const isDark = variant === "dark";

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 ${
        isDark
          ? "bg-expert-bg border-t border-expert-border"
          : "bg-card border-t border-border"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.id);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.muted && navigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                tab.muted
                  ? isDark
                    ? "text-expert-text-secondary/40 cursor-default"
                    : "text-muted-foreground/40 cursor-default"
                  : active
                  ? isDark
                    ? "text-expert-accent"
                    : "text-primary"
                  : isDark
                  ? "text-expert-text-secondary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
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
