import { ChevronDown } from "lucide-react";

interface Props {
  label: string;
  emoji?: string;
  onClick?: () => void;
  active?: boolean;
  showChevron?: boolean;
  className?: string;
}
const Chip = ({ label, emoji, onClick, active, showChevron = true, className = "" }: Props) => (
  <button
    onClick={onClick}
    className={`filter-chip text-xs px-2.5 py-1.5 ${active ? "filter-chip-active" : ""} ${className}`}
  >
    {emoji && <span className="text-sm leading-none">{emoji}</span>}
    <span>{label}</span>
    {showChevron && <ChevronDown className="w-3 h-3 text-muted-foreground" />}
  </button>
);
export default Chip;