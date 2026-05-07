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
      <DrawerContent className="px-4 pb-6">
        <div className="pt-2">
          <h3 className="text-base font-bold text-foreground text-center mb-3">품종 선택 · {c.name}</h3>
          <div className="space-y-1.5">
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