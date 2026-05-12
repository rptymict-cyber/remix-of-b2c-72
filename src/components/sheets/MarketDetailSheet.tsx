import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { findMarket } from "@/data/catalog";

interface Detail {
  marketId: string;
  rank: number;
  unitPrice: number;
  totalRevenue: number;
  logistics: number;
  netRevenue: number;
  unitWeight: number;
}
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  detail: Detail | null;
}
const MarketDetailSheet = ({ open, onOpenChange, detail }: Props) => {
  if (!detail) return null;
  const m = findMarket(detail.marketId);
  const medal = ["🥇", "🥈", "🥉"][detail.rank - 1] || `${detail.rank}위`;
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col h-full min-h-0 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-foreground">{m.name}</h3>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{medal} {detail.rank}위</span>
            </div>
            <p className="text-xs text-muted-foreground">{m.region}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Info label="내 농장까지" value={`${m.distanceKm}km`} />
            <Info label="영업" value={"✅ 정상 영업"} />
            <Info label="휴무일" value={m.holiday} />
            <Info label="법인청과" value={`${m.corporations.length}개`} />
            </div>
            <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-xs font-bold text-primary mb-2">이번 출하 예상 수익</p>
            <Row k="예상 단가" v={`${detail.unitPrice.toLocaleString()}원/${detail.unitWeight}kg`} />
            <Row k="총매출" v={`${detail.totalRevenue.toLocaleString()}원`} />
            <Row k="물류비" v={`-${detail.logistics.toLocaleString()}원`} />
            <div className="border-t border-primary/20 mt-2 pt-2">
              <Row k="예상 순이익" v={`${detail.netRevenue.toLocaleString()}원`} highlight />
            </div>
            </div>
            <div className="mt-3 bg-secondary/50 rounded-xl p-3">
            <p className="text-[11px] font-medium text-foreground mb-1">왜 {detail.rank}위인가요?</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {detail.rank === 1
                ? "단가는 가락시장보다 낮지만, 출발지에서의 물류비가 더 저렴해 실질 순이익이 가장 높습니다."
                : "단가 또는 물류비 조건에서 최상위 시장 대비 일부 손실이 발생합니다."}
            </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">주요 법인청과: {m.corporations.join(" / ")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 shrink-0">
            <button onClick={() => onOpenChange(false)} className="py-3 rounded-xl bg-secondary text-foreground text-sm font-medium">닫기</button>
            <button onClick={() => onOpenChange(false)} className="py-3 rounded-xl bg-primary text-white text-sm font-bold">출하 계획에 추가</button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-secondary/50 rounded-lg px-3 py-2">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
  </div>
);
const Row = ({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) => (
  <div className="flex justify-between text-xs py-0.5">
    <span className="text-muted-foreground">{k}</span>
    <span className={highlight ? "text-base font-extrabold text-primary" : "font-semibold text-foreground"}>{v}</span>
  </div>
);
export default MarketDetailSheet;