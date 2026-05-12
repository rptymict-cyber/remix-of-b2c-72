import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { findCrop } from "@/data/catalog";
import { useApp } from "@/store/appStore";
import { Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}
const VarietySheet = ({ open, onOpenChange }: Props) => {
  const { cropId, variety, setVariety } = useApp();
  const c = findCrop(cropId);
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col h-full min-h-0 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          <h3 className="text-base font-bold text-foreground text-center mb-3 shrink-0">품종 선택 · {c.name}</h3>
          <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
            {["전체 품종", ...c.varieties].map((v) => {
              const sel = v === variety;
              return (
                <button
                  key={v}
                  onClick={() => {
                    setVariety(v);
                    onOpenChange(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${sel ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <span className="text-sm font-medium text-foreground">{v}</span>
                  {sel && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
export default VarietySheet;