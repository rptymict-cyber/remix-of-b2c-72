import { Menu, Bell, RefreshCw } from "lucide-react";

interface AppHeaderProps {
  title: string;
  variant?: "light" | "dark";
  showRefresh?: boolean;
  subtitle?: string;
  onRefresh?: () => void;
}

const AppHeader = ({ title, variant = "light", showRefresh, subtitle, onRefresh }: AppHeaderProps) => {
  const isDark = variant === "dark";

  return (
    <header
      className={`sticky top-0 z-40 ${
        isDark
          ? "bg-expert-bg/95 backdrop-blur-sm border-b border-expert-border"
          : "bg-background/95 backdrop-blur-sm border-b border-border"
      }`}
    >
      <div className="flex items-center justify-between h-12 px-4">
        <button className={isDark ? "text-expert-text-secondary" : "text-muted-foreground"}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className={`text-[15px] font-semibold ${isDark ? "text-expert-text" : "text-foreground"}`}>
            {title}
          </h1>
          {subtitle && (
            <span className={`text-[10px] ${isDark ? "text-expert-text-secondary" : "text-muted-foreground"}`}>
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showRefresh && (
            <button
              onClick={onRefresh}
              className={isDark ? "text-expert-text-secondary" : "text-muted-foreground"}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button className={`relative ${isDark ? "text-expert-text-secondary" : "text-muted-foreground"}`}>
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
