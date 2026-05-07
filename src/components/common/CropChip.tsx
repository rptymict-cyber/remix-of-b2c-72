import { ChevronDown } from "lucide-react";
import { findCrop } from "@/data/catalog";

interface Props {
  cropId: string;
  onClick?: () => void;
  active?: boolean;
  showChevron?: boolean;
  className?: string;
  size?: "sm" | "md";
}
const CropChip = ({ cropId, onClick, active, showChevron = true, className = "", size = "md" }: Props) => {
  const c = findCrop(cropId);
  const sz = size === "sm" ? "text-xs px-2.5 py-1.5" : "text-[13px] px-3 py-2";
  return (
    <button
      onClick={onClick}
      className={`filter-chip ${active ? "filter-chip-active" : ""} ${sz} ${className}`}
    >
      <span className="text-base leading-none">{c.emoji}</span>
      <span>{c.name}</span>
      {showChevron && <ChevronDown className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
};
export default CropChip;