import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { MARKETS, REGION_GROUPS } from "@/data/catalog";
import { useApp } from "@/store/appStore";
import { Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}
const MarketSheet = ({ open, onOpenChange }: Props) => {
  const { marketId, setMarket } = useApp();
  const [region, setRegion] = useState<(typeof REGION_GROUPS)[number]>("전체");
  const list = region === "전체" ? MARKETS : MARKETS.filter((m) => m.regionGroup === region);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col h-full min-h-0 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="shrink-0">
            <h3 className="text-base font-bold text-foreground text-center mb-3">시장 선택</h3>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3">
            {REGION_GROUPS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${region === r ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
              >
                {r}
              </button>
            ))}
            </div>
          </div>
          <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
            {list.map((m) => {
              const sel = m.id === marketId;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMarket(m.id);
                    onOpenChange(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${sel ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.region} · 약 {m.distanceKm}km</p>
                  </div>
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
export default MarketSheet;