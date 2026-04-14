import { Menu, Bell, RefreshCw } from "lucide-react";

interface AppHeaderProps {
  title: string;
  variant?: "light" | "dark";
  showRefresh?: boolean;
  subtitle?: string;
  onRefresh?: () => void;
}

const AppHeader = ({ title, showRefresh, subtitle, onRefresh }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-14 px-5">
        <button className="text-muted-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[15px] font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showRefresh && (
            <button onClick={onRefresh} className="text-muted-foreground">
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          )}
          <button className="relative text-muted-foreground">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
