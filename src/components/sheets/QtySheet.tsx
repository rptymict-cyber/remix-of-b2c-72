import { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useApp, type Unit } from "@/store/appStore";
import { findCrop } from "@/data/catalog";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}
const UNITS: { id: Unit; label: string; toKg: (v: number, boxKg: number) => number; fromKg: (kg: number, boxKg: number) => number }[] = [
  { id: "kg", label: "kg", toKg: (v) => v, fromKg: (kg) => kg },
  { id: "box", label: "상자", toKg: (v, b) => v * b, fromKg: (kg, b) => Math.round(kg / b) },
  { id: "ton", label: "톤", toKg: (v) => v * 1000, fromKg: (kg) => Math.round((kg / 1000) * 100) / 100 },
];

const QtySheet = ({ open, onOpenChange }: Props) => {
  const { shipQtyKg, setShipQty, cropId, profile, unit, setUnit } = useApp();
  const crop = findCrop(cropId);
  const boxKg = crop.defaultUnitKg;
  const [u, setU] = useState<Unit>(unit);
  const [val, setVal] = useState<number>(UNITS.find((x) => x.id === unit)!.fromKg(shipQtyKg, boxKg));

  useEffect(() => {
    if (open) {
      setU(unit);
      setVal(UNITS.find((x) => x.id === unit)!.fromKg(shipQtyKg, boxKg));
    }
  }, [open, unit, shipQtyKg, boxKg]);

  const apply = () => {
    const cfg = UNITS.find((x) => x.id === u)!;
    const kg = Math.max(1, Math.round(cfg.toKg(val, boxKg)));
    setUnit(u);
    setShipQty(kg);
    onOpenChange(false);
  };

  // 면적 기반 자동 추정 (단순: 1㎡ = 약 0.4kg)
  const estimatedKg = Math.round(profile.farmAreaM2 * 0.4);
  const cfg = UNITS.find((x) => x.id === u)!;
  const valKg = cfg.toKg(val, boxKg);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <div className="pt-2">
          <h3 className="text-base font-bold text-foreground text-center mb-4">출하량 입력</h3>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              min={0}
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              className="flex-1 px-4 py-3 text-2xl font-bold text-foreground rounded-xl border border-border bg-background text-right"
            />
            <div className="flex bg-secondary rounded-xl p-1">
              {UNITS.map((x) => (
                <button
                  key={x.id}
                  onClick={() => setU(x.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${u === x.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            {crop.emoji} {crop.name} 기준 1상자 = {boxKg}kg · 입력값 {Math.round(valKg).toLocaleString()}kg
          </p>
          <button
            onClick={() => {
              setU("kg");
              setVal(estimatedKg);
            }}
            className="w-full text-left bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4"
          >
            <p className="text-xs font-semibold text-primary">내 농장 자동 입력</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{profile.farmAreaM2.toLocaleString()}㎡ 예상 수확량 약 {estimatedKg.toLocaleString()}kg</p>
          </button>
          <button onClick={apply} className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold">입력 완료</button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
export default QtySheet;