import { Home, BarChart3, BrainCircuit, Store, Sprout } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "/", label: "홈", icon: Home },
  { id: "/market", label: "시세", icon: BarChart3 },
  { id: "/prediction", label: "예측", icon: BrainCircuit },
  { id: "/sales", label: "판매처", icon: Store },
  { id: "/crop", label: "작물", icon: Sprout },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/prediction") return location.pathname.startsWith("/prediction");
    return location.pathname === path;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-[56px] max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.id);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-[3px] flex-1 h-full transition-colors ${
                active
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.6} />
              <span className={`text-[10px] leading-none ${active ? "font-bold" : "font-medium"}`}>
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
