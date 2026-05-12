import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { findCrop } from "@/data/catalog";

interface UnitOption {
  kg: number;
  primary?: boolean;
}

// 작물 · 품종별 실제 경매 거래 단량
// key: cropId, 또는 `${cropId}:${variety}` (품종별 구분 필요할 때)
const UNITS_BY_CROP: Record<string, UnitOption[]> = {
  // 고추 — 건고추 기준 1/10/20/30kg, 풋고추는 10kg 단일
  pepper: [{ kg: 1 }, { kg: 10 }, { kg: 20, primary: true }, { kg: 30 }],
  "pepper:풋고추": [{ kg: 10, primary: true }],
  "pepper:청양고추": [{ kg: 10, primary: true }],
  apple: [{ kg: 5 }, { kg: 10, primary: true }, { kg: 15 }],
  cabbage: [{ kg: 10, primary: true }],
  onion: [{ kg: 12 }, { kg: 15, primary: true }, { kg: 20 }],
  radish: [{ kg: 18, primary: true }, { kg: 20 }],
  tomato: [{ kg: 5, primary: true }, { kg: 10 }],
  strawberry: [{ kg: 2, primary: true }],
  potato: [{ kg: 10 }, { kg: 20, primary: true }],
  garlic: [{ kg: 1 }, { kg: 10, primary: true }],
  corn: [{ kg: 10, primary: true }],
};

const optionsFor = (cropId: string, variety: string): UnitOption[] => {
  const v = UNITS_BY_CROP[`${cropId}:${variety}`];
  if (v) return v;
  return UNITS_BY_CROP[cropId] || [{ kg: findCrop(cropId).defaultUnitKg, primary: true }];
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cropId: string;
  variety: string;
  selectedKg: number;
  onConfirm: (kg: number) => void;
}

const UnitSheet = ({ open, onOpenChange, cropId, variety, selectedKg, onConfirm }: Props) => {
  const crop = findCrop(cropId);
  const options = useMemo(() => optionsFor(cropId, variety), [cropId, variety]);
  const isSingle = options.length === 1;

  const [pending, setPending] = useState<number>(selectedKg);
  useEffect(() => {
    if (open) setPending(selectedKg);
  }, [open, selectedKg]);

  const confirm = () => {
    onConfirm(pending);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-5 pb-6">
        <div className="pt-3">
          <h3 className="text-[16px] font-extrabold text-foreground text-center leading-tight">
            거래 단위 선택
          </h3>
          <p className="text-[12px] text-muted-foreground text-center mt-1">
            {crop.emoji} {crop.name} ({variety}) 기준
          </p>
        </div>

        {isSingle ? (
          <div className="mt-5 mb-2 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-4 text-center">
            <p className="text-[13px] font-semibold text-foreground">
              이 작물은 {options[0].kg}kg 단일 단위로만 거래됩니다.
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
              실제 경매에서 거래되는 단량이 1개뿐이라 다른 기준을 선택할 수 없어요.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2 max-h-[55vh] overflow-y-auto">
            {options.map((opt) => {
              const sel = pending === opt.kg;
              return (
                <button
                  key={opt.kg}
                  onClick={() => setPending(opt.kg)}
                  className={`w-full min-h-12 flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all ${
                    sel ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        sel ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}
                    >
                      {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    <span className={`text-[15px] font-bold ${sel ? "text-primary" : "text-foreground"}`}>
                      {opt.kg}kg 기준
                    </span>
                    {opt.primary && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        주거래 단위
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-3 px-1 leading-relaxed">
          실제 경매에서 가장 많이 거래되는 단위를 기준으로 시세가 표시됩니다.
        </p>

        <button
          onClick={confirm}
          disabled={isSingle}
          className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-white text-[15px] font-bold disabled:opacity-40"
        >
          확인
        </button>
      </DrawerContent>
    </Drawer>
  );
};

export default UnitSheet;
export { optionsFor as getUnitOptions };