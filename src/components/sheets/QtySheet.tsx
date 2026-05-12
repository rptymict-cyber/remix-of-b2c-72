import { useEffect, useMemo, useState } from "react";
import { Sprout } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useApp, type Unit } from "@/store/appStore";
import { findCrop } from "@/data/catalog";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const MAX_KG = 10000;

const UNITS: {
  id: Unit;
  label: string;
  toKg: (v: number, boxKg: number) => number;
  fromKg: (kg: number, boxKg: number) => number;
}[] = [
  { id: "kg", label: "kg", toKg: (v) => v, fromKg: (kg) => kg },
  { id: "box", label: "상자", toKg: (v, b) => v * b, fromKg: (kg, b) => Math.max(1, Math.round(kg / b)) },
  { id: "ton", label: "톤", toKg: (v) => v * 1000, fromKg: (kg) => Math.round((kg / 1000) * 100) / 100 },
];

const QUICK_CHIPS_KG = [100, 300, 500, 1000];

// 단위별 프리셋 값(해당 단위의 표시값 그대로)
const QUICK_PRESETS: Record<Unit, number[]> = {
  kg: [100, 300, 500, 1000],
  box: [5, 15, 25, 50],
  ton: [0.1, 0.3, 0.5, 1],
};

const UNIT_SUFFIX: Record<Unit, string> = {
  kg: "kg",
  box: "상자",
  ton: "톤",
};

const QtySheet = ({ open, onOpenChange }: Props) => {
  const { shipQtyKg, setShipQty, cropId, profile, unit, setUnit } = useApp();
  const crop = findCrop(cropId);
  const boxKg = crop.defaultUnitKg;

  const [u, setU] = useState<Unit>(unit);
  const [val, setVal] = useState<number>(
    UNITS.find((x) => x.id === unit)!.fromKg(shipQtyKg, boxKg),
  );

  useEffect(() => {
    if (open) {
      setU(unit);
      setVal(UNITS.find((x) => x.id === unit)!.fromKg(shipQtyKg, boxKg));
    }
  }, [open, unit, shipQtyKg, boxKg]);

  const cfg = UNITS.find((x) => x.id === u)!;
  const valKg = useMemo(() => Math.round(cfg.toKg(Number(val) || 0, boxKg)), [val, cfg, boxKg]);

  const error =
    !val || valKg <= 0
      ? "출하량을 입력해 주세요."
      : valKg > MAX_KG
        ? `최대 ${MAX_KG.toLocaleString()}kg까지 입력 가능합니다.`
        : "";

  const handleChangeUnit = (next: Unit) => {
    const nextCfg = UNITS.find((x) => x.id === next)!;
    const kg = cfg.toKg(Number(val) || 0, boxKg);
    setU(next);
    setVal(nextCfg.fromKg(kg, boxKg));
  };

  const setFromKg = (kg: number) => {
    setVal(cfg.fromKg(kg, boxKg));
  };

  const estimatedKg = Math.round(profile.farmAreaM2 * 0.4);

  const apply = () => {
    if (error) return;
    setUnit(u);
    setShipQty(valKg);
    onOpenChange(false);
  };

  const reset = () => {
    setU("kg");
    setVal(500);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col h-full min-h-0 px-5 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="text-center">
          <h3 className="text-base font-bold text-foreground">출하량 입력</h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            출하할 물량을 입력하고 단위를 선택해 주세요
          </p>
            </div>

        {/* 입력 + 단위 세그먼트 */}
            <div className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={val === 0 ? "" : val}
            onChange={(e) => {
              const n = e.target.value === "" ? 0 : Number(e.target.value);
              if (Number.isNaN(n)) return;
              setVal(n);
            }}
            placeholder="0"
            className="flex-1 min-w-0 bg-transparent text-3xl font-extrabold text-foreground outline-none"
          />
          <div className="flex bg-secondary rounded-full p-1 shrink-0">
            {UNITS.map((x) => {
              const sel = u === x.id;
              return (
                <button
                  key={x.id}
                  onClick={() => handleChangeUnit(x.id)}
                  className={`px-3 h-8 inline-flex items-center justify-center rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                    sel
                      ? "bg-white text-primary border border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {x.label}
                </button>
              );
            })}
          </div>
            </div>

        {/* 기준 안내 */}
            <p className="text-[11px] text-muted-foreground mt-2 px-1">
          {crop.emoji} {crop.name} 기준 1상자 = {boxKg}kg · 입력값 최대 {MAX_KG.toLocaleString()}kg
            </p>

        {/* 빠른 입력 — 선택된 단위 기준 프리셋 */}
            <div className="mt-3 grid grid-cols-4 gap-2">
          {QUICK_PRESETS[u].map((preset) => {
            const presetKg = Math.round(cfg.toKg(preset, boxKg));
            const sel = valKg === presetKg;
            return (
              <button
                key={preset}
                onClick={() => setVal(preset)}
                className={`h-10 rounded-full text-[13px] font-semibold border transition-all ${
                  sel
                    ? "border-primary text-primary bg-primary/5"
                    : "border-border text-foreground bg-card"
                }`}
              >
                {preset.toLocaleString()}
                {UNIT_SUFFIX[u]}
              </button>
            );
          })}
            </div>

        {/* 자동 입력 카드 */}
            <button
          onClick={() => {
            setU("kg");
            setVal(estimatedKg);
          }}
          className="mt-3 w-full bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">내 농장 자동 입력</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {profile.farmAreaM2.toLocaleString()}㎡ 예상 수확량 약 {estimatedKg.toLocaleString()}kg
            </p>
          </div>
            </button>

        {/* 에러 메시지 */}
            {error && (
          <p className="text-[11px] text-destructive mt-2 px-1">{error}</p>
            )}
          </div>

          {/* CTA */}
          <div className="shrink-0 pt-3">
            <button
          onClick={apply}
          disabled={!!error}
              className="w-full h-12 rounded-2xl bg-primary text-white text-[15px] font-bold disabled:opacity-40"
            >
          입력 완료
            </button>
            <button
          onClick={reset}
              className="mt-1 w-full py-1.5 text-[12px] font-medium text-muted-foreground"
            >
          초기화
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default QtySheet;
