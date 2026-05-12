import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";

interface FilterPillProps {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

/**
 * 바텀시트 호출용 공통 필터 버튼
 * - 흰색 라운드 풀필
 * - 좌측 아이콘, 중앙 라벨(말줄임), 우측 쉐브론
 * - 모든 화면에서 동일한 높이/패딩/타이포 사용
 */
const FilterPill = ({ icon, label, onClick, disabled, active, className = "" }: FilterPillProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 w-full h-12 px-3.5 rounded-2xl border bg-card transition-all ${
      active
        ? "border-primary/60 bg-primary/5"
        : "border-border hover:border-primary/40"
    } shadow-[0_1px_2px_rgba(15,23,42,0.04)] active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 ${className}`}
  >
    <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-muted-foreground">
      {icon}
    </span>
    <span className="flex-1 min-w-0 text-left text-[13px] font-semibold text-foreground truncate">
      {label}
    </span>
    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

export default FilterPill;
