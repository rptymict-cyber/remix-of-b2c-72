import { useEffect, useState } from "react";
import { Check, Leaf, Home, Calendar, Telescope } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import type { CultivationMethod, SeasonBasis } from "@/store/appStore";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  method: CultivationMethod;
  season: SeasonBasis;
  onConfirm: (method: CultivationMethod, season: SeasonBasis) => void;
}

const CultivationSheet = ({ open, onOpenChange, method, season, onConfirm }: Props) => {
  const [m, setM] = useState<CultivationMethod>(method);
  const [s, setS] = useState<SeasonBasis>(season);

  useEffect(() => {
    if (open) {
      setM(method);
      setS(season);
    }
  }, [open, method, season]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <div className="pt-2 pb-4 text-center">
          <h3 className="text-base font-bold text-foreground">재배 조건 설정</h3>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
            재배 방식과 시즌 기준을 설정하면<br />
            더 정확한 작물을 추천해드립니다
          </p>
        </div>

        <p className="text-[12px] font-bold text-foreground mb-2">재배 방식</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <OptionCard
            selected={m === "노지"}
            onClick={() => setM("노지")}
            icon={<Leaf className="w-5 h-5 text-primary" />}
            label="노지재배"
          />
          <OptionCard
            selected={m === "시설"}
            onClick={() => setM("시설")}
            icon={<Home className="w-5 h-5 text-primary" />}
            label="시설재배"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mb-5 px-1">
          ⓘ 시설재배(딸기·토마토 등)는 날씨 영향도가 달라 별도 기준으로 추천됩니다
        </p>

        <p className="text-[12px] font-bold text-foreground mb-2">추천 기준 시즌</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <OptionCard
            selected={s === "이번"}
            onClick={() => setS("이번")}
            icon={<Calendar className="w-5 h-5 text-primary" />}
            label="이번 시즌"
            sub="(현재 재배·출하 중심)"
          />
          <OptionCard
            selected={s === "다음"}
            onClick={() => setS("다음")}
            icon={<Telescope className="w-5 h-5 text-primary" />}
            label="다음 시즌"
            sub="(차기 재배 계획 중심)"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mb-5 px-1">
          ⓘ 다음 시즌 선택 시 가격 전망과 재배 계획 기준으로 추천됩니다
        </p>

        <button
          onClick={() => {
            onConfirm(m, s);
            onOpenChange(false);
          }}
          className="w-full py-3.5 rounded-2xl bg-primary text-white text-sm font-bold"
        >
          추천 조건 적용하기
        </button>
      </DrawerContent>
    </Drawer>
  );
};

const OptionCard = ({
  selected,
  onClick,
  icon,
  label,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub?: string;
}) => (
  <button
    onClick={onClick}
    className={`relative rounded-xl border min-h-[110px] flex flex-col items-center justify-center gap-1.5 px-3 py-3 ${
      selected ? "border-primary bg-primary/5" : "border-border bg-card"
    }`}
  >
    {icon}
    <span className="text-[13px] font-bold text-foreground">{label}</span>
    {sub && <span className="text-[10px] text-muted-foreground text-center leading-tight">{sub}</span>}
    {selected && (
      <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <Check className="w-3 h-3 text-white" strokeWidth={3} />
      </span>
    )}
  </button>
);

export default CultivationSheet;