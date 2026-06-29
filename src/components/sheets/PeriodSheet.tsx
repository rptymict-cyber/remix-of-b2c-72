import { useState } from "react";
import { Check, X, Clock, Calendar as CalendarIcon, ChevronRight, Info, ChevronLeft } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export type PeriodKey = "today" | "yesterday" | "7d" | "1m" | "custom";

export interface PeriodValue {
  key: PeriodKey;
  label: string;
  range?: { from: Date; to: Date };
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selected: PeriodKey;
  onSelect: (v: PeriodValue) => void;
}

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const fmtDay = (d: Date) => format(d, "yyyy.MM.dd (E)", { locale: ko });
const fmtShort = (d: Date) => format(d, "yyyy.MM.dd");
const fmtMD = (d: Date) => format(d, "MM.dd");

export const buildPeriodValue = (key: Exclude<PeriodKey, "custom">): PeriodValue => {
  const t = today();
  if (key === "today") return { key, label: "오늘", range: { from: t, to: t } };
  if (key === "yesterday") {
    const y = addDays(t, -1);
    return { key, label: "어제", range: { from: y, to: y } };
  }
  if (key === "7d") return { key, label: "최근 7일", range: { from: addDays(t, -6), to: t } };
  return { key, label: "최근 1개월", range: { from: addDays(t, -29), to: t } };
};

export const formatCustomLabel = (from: Date, to: Date) => {
  if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth() && from.getDate() === to.getDate()) {
    return fmtShort(from);
  }
  if (from.getFullYear() === to.getFullYear()) {
    return `${fmtShort(from)} ~ ${fmtMD(to)}`;
  }
  return `${fmtShort(from)} ~ ${fmtShort(to)}`;
};

const QuickCard = ({
  icon, label, sub, selected, onClick,
}: { icon: React.ReactNode; label: string; sub: string; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`relative w-full min-h-[84px] rounded-2xl border-2 px-3.5 py-3 flex items-center gap-3 text-left transition-all ${
      selected ? "border-primary bg-primary/5" : "border-border bg-card"
    }`}
  >
    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className={`text-[14px] font-extrabold ${selected ? "text-primary" : "text-foreground"}`}>{label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
    </div>
    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
      {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
  </button>
);

const PeriodSheet = ({ open, onOpenChange, selected, onSelect }: Props) => {
  const [calOpen, setCalOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();

  const t = today();
  const quicks: Array<{ key: Exclude<PeriodKey, "custom">; icon: React.ReactNode; sub: string }> = [
    { key: "today", icon: <Clock className="w-4 h-4" />, sub: fmtDay(t) },
    { key: "yesterday", icon: <Clock className="w-4 h-4" />, sub: fmtDay(addDays(t, -1)) },
    { key: "7d", icon: <CalendarIcon className="w-4 h-4" />, sub: `${fmtShort(addDays(t, -6))} ~ ${fmtMD(t)}` },
    { key: "1m", icon: <CalendarIcon className="w-4 h-4" />, sub: `${fmtShort(addDays(t, -29))} ~ ${fmtMD(t)}` },
  ];

  const pick = (k: Exclude<PeriodKey, "custom">) => {
    onSelect(buildPeriodValue(k));
    onOpenChange(false);
  };

  const applyRange = () => {
    if (!range?.from) return;
    const to = range.to ?? range.from;
    onSelect({
      key: "custom",
      label: formatCustomLabel(range.from, to),
      range: { from: range.from, to },
    });
    setCalOpen(false);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)] max-h-[88dvh] overflow-y-auto">
          {!calOpen ? (
            <>
              <div className="flex items-center justify-between mb-1 pt-1">
                <h3 className="text-[16px] font-extrabold text-foreground">기간 선택</h3>
                <button onClick={() => onOpenChange(false)} aria-label="닫기" className="text-muted-foreground p-1 -m-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
                원하는 기간을 선택하면 해당 기간의 경매내역과 시세 흐름을 확인할 수 있어요.
              </p>

              {/* 빠른 조회 */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <Clock className="w-4 h-4 text-primary" />
                <h4 className="text-[13px] font-extrabold text-foreground">빠른 조회</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quicks.map((q) => (
                  <QuickCard
                    key={q.key}
                    icon={q.icon}
                    label={buildPeriodValue(q.key).label}
                    sub={q.sub}
                    selected={selected === q.key}
                    onClick={() => pick(q.key)}
                  />
                ))}
              </div>

              <div className="h-px bg-border my-4" />

              {/* 직접 선택 */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <h4 className="text-[13px] font-extrabold text-foreground">직접 선택</h4>
              </div>
              <button
                onClick={() => setCalOpen(true)}
                className={`w-full rounded-2xl border-2 px-4 py-3.5 flex items-center gap-3 text-left transition-all ${
                  selected === "custom" ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${selected === "custom" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <CalendarIcon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-extrabold ${selected === "custom" ? "text-primary" : "text-foreground"}`}>캘린더에서 날짜 선택</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">원하는 시작일과 종료일을 직접 선택할 수 있어요.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>

              {/* 안내 */}
              <div className="mt-4 rounded-xl bg-primary/8 border border-primary/15 px-3 py-2.5 flex items-start gap-2" style={{ backgroundColor: "hsl(var(--primary) / 0.06)" }}>
                <Info className="w-4 h-4 text-primary shrink-0 mt-px" />
                <p className="text-[11.5px] text-foreground/80 leading-relaxed">
                  선택한 기간은 모든 시장과 품목의 시세 및 경매내역 조회에 적용됩니다.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 pt-1">
                <button onClick={() => setCalOpen(false)} aria-label="뒤로" className="text-muted-foreground p-1 -m-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-[16px] font-extrabold text-foreground">날짜 선택</h3>
                <button onClick={() => onOpenChange(false)} aria-label="닫기" className="text-muted-foreground p-1 -m-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                시작일과 종료일을 차례로 선택해 주세요.
              </p>

              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  locale={ko}
                  disabled={{ after: t }}
                  className="p-2 pointer-events-auto"
                />
              </div>

              <div className="mt-2 rounded-xl bg-muted/60 px-3 py-2.5 text-[12px] text-foreground/80">
                {range?.from
                  ? range.to
                    ? `${fmtShort(range.from)} ~ ${fmtShort(range.to)}`
                    : `${fmtShort(range.from)} ~ 종료일 선택`
                  : "시작일을 선택해 주세요."}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setRange(undefined)}
                  className="flex-1 h-12 rounded-2xl border-2 border-border bg-card text-[14px] font-bold text-foreground"
                >
                  초기화
                </button>
                <button
                  onClick={applyRange}
                  disabled={!range?.from}
                  className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-[14px] font-extrabold disabled:opacity-40"
                >
                  적용
                </button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PeriodSheet;
