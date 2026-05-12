import { Bell, RefreshCw, ChevronLeft, User, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileStatusBar from "./MobileStatusBar";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  variant?: "logo" | "back";
}

const AppHeader = ({ title, subtitle, showRefresh, onRefresh, showBack, rightAction, variant = "logo" }: AppHeaderProps) => {
  const nav = useNavigate();
  const useBack = showBack || variant === "back";
  return (
    <header className="fixed top-0 left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 bg-white/95 backdrop-blur-sm border-b border-border">
      <MobileStatusBar />
      <div className="relative flex items-center justify-center h-14 px-4">
        {useBack ? (
          <button onClick={() => nav(-1)} className="absolute left-4 text-foreground flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={() => nav("/mypage")} className="absolute left-4 text-foreground" aria-label="마이페이지">
            <User className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col items-center pointer-events-none">
          <h1 className="text-[15px] font-semibold text-foreground">{title}</h1>
          {subtitle && <span className="text-[10px] text-muted-foreground">{subtitle}</span>}
        </div>
        <div className="absolute right-4 flex items-center gap-3">
          {showRefresh && (
            <button onClick={onRefresh} className="text-muted-foreground" aria-label="새로고침">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {rightAction}
          {!useBack && (
            <button onClick={() => nav("/notifications")} className="relative text-foreground" aria-label="알림">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
