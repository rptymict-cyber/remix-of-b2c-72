import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { useApp, type Plan } from "@/store/appStore";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  feature?: string;
}
const PLANS: { id: Plan; price: string; desc: string; recommended?: boolean }[] = [
  { id: "Basic", price: "4,900원/월", desc: "예측 30일 + 알림" },
  { id: "Pro", price: "7,900원/월", desc: "예측 180일 + 작물 추천", recommended: true },
  { id: "Premium", price: "9,900원/월", desc: "전체 기능 포함" },
];

const UpgradeModal = ({ open, onOpenChange, feature = "이 기능" }: Props) => {
  const { setProfile } = useApp();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground">{feature}은 유료 구독자 전용입니다</h3>
          <p className="text-xs text-muted-foreground mt-1">아래 플랜으로 업그레이드하면 즉시 이용 가능합니다</p>
        </div>
        <div className="space-y-2 mt-4">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProfile({ plan: p.id });
                onOpenChange(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 ${p.recommended ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">{p.id} {p.recommended && <span className="text-[10px] text-primary ml-1">추천</span>}</p>
                <p className="text-[11px] text-muted-foreground">{p.desc}</p>
              </div>
              <span className="text-sm font-semibold text-primary">{p.price}</span>
            </button>
          ))}
        </div>
        <button onClick={() => onOpenChange(false)} className="w-full text-xs text-muted-foreground py-2 mt-2">나중에 하기</button>
      </DialogContent>
    </Dialog>
  );
};
export default UpgradeModal;