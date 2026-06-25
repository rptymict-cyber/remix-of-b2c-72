import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { findCrop } from "@/data/catalog";

export type PriceMode = "actual" | "perKg" | "per10kg" | "per20kg" | "per100kg" | "cropDefault";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cropId: string;
  basePrice: number; // 가격 (defaultUnitKg 기준)
  defaultUnitKg: number;
  selectedMode: PriceMode;
  onApply: (mode: PriceMode) => void;
}

const round100 = (n: number) => Math.round(n / 100) * 100;

export const computePriceByMode = (
  mode: PriceMode,
  basePrice: number,
  defaultUnitKg: number,
): { price: number; unitLabel: string; unitKg: number } => {
  const kg = basePrice / defaultUnitKg;
  switch (mode) {
    case "perKg":
      return { price: Math.round(kg), unitLabel: "kg", unitKg: 1 };
    case "per10kg":
      return { price: round100(kg * 10), unitLabel: "10kg", unitKg: 10 };
    case "per20kg":
      return { price: round100(kg * 20), unitLabel: "20kg", unitKg: 20 };
    case "per100kg":
      return { price: round100(kg * 100), unitLabel: "100kg", unitKg: 100 };
    case "actual":
    case "cropDefault":
    default:
      return { price: basePrice, unitLabel: `${defaultUnitKg}kg`, unitKg: defaultUnitKg };
  }
};

const PriceModeSheet = ({ open, onOpenChange, cropId, basePrice, defaultUnitKg, selectedMode, onApply }: Props) => {
  const crop = findCrop(cropId);
  const [pending, setPending] = useState<PriceMode>(selectedMode);
  useEffect(() => {
    if (open) setPending(selectedMode);
  }, [open, selectedMode]);

  const kg = Math.round(basePrice / defaultUnitKg);

  const options: { mode: PriceMode; title: string; desc: string }[] = [
    { mode: "actual", title: "실거래 단위", desc: `현재가 ${basePrice.toLocaleString()}원 / ${defaultUnitKg}kg 상자` },
    { mode: "perKg", title: "kg 환산가", desc: `1kg당 ${kg.toLocaleString()}원` },
    { mode: "per10kg", title: "10kg 기준", desc: `10kg당 ${round100(kg * 10).toLocaleString()}원` },
    { mode: "per20kg", title: "20kg 기준", desc: `20kg당 ${round100(kg * 20).toLocaleString()}원` },
    { mode: "per100kg", title: "100kg 기준", desc: `100kg당 ${round100(kg * 100).toLocaleString()}원` },
    { mode: "cropDefault", title: "작물 기본 단위", desc: `${crop.name} 기본 거래 단위로 보기` },
  ];

  const apply = () => {
    onApply(pending);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col h-full min-h-0 px-5 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="shrink-0 pt-1">
            <h3 className="text-[16px] font-extrabold text-foreground text-center leading-tight">
              가격 표시 기준
            </h3>
            <p className="text-[12px] text-muted-foreground text-center mt-1">
              가격을 비교하기 쉽게 기준 단량을 선택하세요.
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto mt-3 space-y-2">
            {options.map((opt) => {
              const sel = pending === opt.mode;
              return (
                <button
                  key={opt.mode}
                  onClick={() => setPending(opt.mode)}
                  className={`w-full min-h-12 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                    sel ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-[14px] font-bold ${sel ? "text-primary" : "text-foreground"}`}>
                      {opt.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      sel ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}
                  >
                    {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-2xl border-2 border-border text-foreground text-[15px] font-bold"
            >
              취소
            </button>
            <button
              onClick={apply}
              className="h-12 rounded-2xl bg-primary text-white text-[15px] font-bold"
            >
              적용하기
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PriceModeSheet;
