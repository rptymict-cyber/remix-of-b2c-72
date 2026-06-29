import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * 공통 드롭다운 버튼.
 * 정렬/기준 선택 등 바텀시트를 여는 트리거에 사용.
 * 일관된 화이트 + 라이트 그레이 보더 + chevron-down 스타일을 제공한다.
 */
const DropdownButton = ({ label, onClick, className, ariaLabel }: DropdownButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel ?? label}
    className={cn(
      "h-9 px-3 inline-flex items-center gap-1.5 rounded-xl",
      "bg-white border border-[#E1E5EA] text-[12.5px] font-semibold text-[#111827]",
      "active:scale-[0.98] transition-transform shrink-0",
      className,
    )}
  >
    <span className="truncate">{label}</span>
    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

export default DropdownButton;
