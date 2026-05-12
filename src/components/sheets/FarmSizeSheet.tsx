import { useEffect, useState } from "react";
import { AlertTriangle, Sprout, Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

type Unit = "m2" | "pyeong";

const PRESETS: { label: string; value: number }[] = [
  { label: "1,000㎡\n미만", value: 800 },
  { label: "1,000~\n3,000㎡", value: 2000 },
  { label: "3,000~\n5,000㎡", value: 4000 },
  { label: "5,000㎡\n이상", value: 6000 },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentAreaM2: number;
  cropName?: string;
  yieldPerM2Kg?: number; // default 0.3
  onConfirm: (areaM2: number) => void;
}

const FarmSizeSheet = ({
  open,
  onOpenChange,
  currentAreaM2,
  cropName = "고추",
  yieldPerM2Kg = 0.3,
  onConfirm,
}: Props) => {
  const [unit, setUnit] = useState<Unit>("m2");
  const [draftM2, setDraftM2] = useState(currentAreaM2);
  const [text, setText] = useState(String(currentAreaM2));

  useEffect(() => {
    if (open) {
      setUnit("m2");
      setDraftM2(currentAreaM2);
      setText(String(currentAreaM2));
    }
  }, [open, currentAreaM2]);

  const onTextChange = (v: string) => {
    const cleaned = v.replace(/[^0-9]/g, "");
    setText(cleaned);
    const n = Number(cleaned || 0);
    const m2 = unit === "m2" ? n : Math.round(n * 3.305785);
    setDraftM2(m2);
  };

  const switchUnit = (u: Unit) => {
    setUnit(u);
    if (u === "m2") setText(String(draftM2));
    else setText(String(Math.round(draftM2 / 3.305785)));
  };

  const yieldKg = Math.round(draftM2 * yieldPerM2Kg);
  const disabled = draftM2 <= 0 || draftM2 === currentAreaM2;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col h-full min-h-0 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="pb-3 text-center">
          <h3 className="text-base font-bold text-foreground">농장 규모</h3>
          <p className="text-[12px] text-muted-foreground mt-1">예상 수확량 계산의 기준이 됩니다</p>
            </div>

            <p className="text-[12px] font-bold text-foreground mb-2">직접 입력</p>
            <div className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3 mb-2">
          <input
            inputMode="numeric"
            value={Number(text || 0).toLocaleString()}
            onChange={(e) => onTextChange(e.target.value.replace(/,/g, ""))}
            className="flex-1 bg-transparent text-2xl font-extrabold text-foreground outline-none min-w-0"
          />
          <div className="flex rounded-lg border border-border overflow-hidden text-[12px] font-bold shrink-0">
            {(["m2", "pyeong"] as const).map((u) => (
              <button
                key={u}
                onClick={() => switchUnit(u)}
                className={`px-3 py-1.5 ${unit === u ? "bg-primary/10 text-primary" : "bg-card text-muted-foreground"}`}
              >
                {u === "m2" ? "㎡" : "평"}
              </button>
            ))}
          </div>
            </div>

            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-4">
          <Sprout className="w-3.5 h-3.5 text-primary" />
          <span>
            {cropName} 기준 예상 수확량 약{" "}
            <span className="text-primary font-bold">{yieldKg.toLocaleString()}kg</span>
          </span>
            </div>

            <p className="text-[12px] font-bold text-foreground mb-2">빠른 선택</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
          {PRESETS.map((p) => {
            const sel = draftM2 === p.value;
            return (
              <button
                key={p.label}
                onClick={() => {
                  setDraftM2(p.value);
                  setUnit("m2");
                  setText(String(p.value));
                }}
                className={`relative h-[68px] rounded-xl border text-[11px] font-semibold whitespace-pre-line leading-tight flex items-center justify-center ${
                  sel ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground"
                }`}
              >
                {p.label}
                {sel && (
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 flex items-start gap-1.5 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-700">규모를 변경하면 예상 수익 계산이 다시 계산됩니다</p>
            </div>
          </div>

          <button
          onClick={() => {
            onConfirm(draftM2);
            onOpenChange(false);
          }}
          disabled={disabled}
            className="shrink-0 mt-3 w-full h-12 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40"
          >
          입력 완료
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default FarmSizeSheet;