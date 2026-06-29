import { useEffect, useMemo, useState } from "react";
import { X, Calendar as CalendarIcon, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export type PeriodKey = "today" | "yesterday" | "7d" | "1m" | "custom" | "manual";

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

/* ---------- date utils ---------- */
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth()+n); return x; };
const sameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const fmtShort = (d: Date) => format(d, "yyyy.MM.dd");
const fmtMD = (d: Date) => format(d, "MM.dd");
const fmtInput = (d: Date) => format(d, "yyyy.MM.dd");

export const buildPeriodValue = (key: Exclude<PeriodKey, "custom" | "manual">): PeriodValue => {
  const t = today();
  if (key === "today") return { key, label: "오늘", range: { from: t, to: t } };
  if (key === "yesterday") { const y = addDays(t,-1); return { key, label: "어제", range: { from: y, to: y } }; }
  if (key === "7d") return { key, label: "최근 7일", range: { from: addDays(t,-6), to: t } };
  return { key, label: "최근 1개월", range: { from: addMonths(t,-1), to: t } };
};

export const formatCustomLabel = (from: Date, to: Date) => {
  if (sameDay(from, to)) return fmtShort(from);
  if (from.getFullYear() === to.getFullYear()) return `${fmtShort(from)} ~ ${fmtMD(to)}`;
  return `${fmtShort(from)} ~ ${fmtShort(to)}`;
};

/* ---------- quick chips ---------- */
type ChipKey = "today" | "yesterday" | "7d" | "1m" | "manual";
const CHIPS: { key: ChipKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "7d", label: "최근 7일" },
  { key: "1m", label: "최근 1개월" },
  { key: "manual", label: "직접 입력" },
];

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`shrink-0 h-8 px-3 rounded-full text-[12px] font-bold border transition-colors ${
      active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
    }`}
  >
    {children}
  </button>
);

/* ---------- calendar grid ---------- */
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const CalendarGrid = ({
  month, setMonth, range, onPick,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  range: { from?: Date; to?: Date };
  onPick: (d: Date) => void;
}) => {
  const t = today();
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = first.getDay();
  const gridStart = addDays(first, -startOffset);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const isInRange = (d: Date) => {
    if (!range.from || !range.to) return false;
    const t0 = range.from.getTime(), t1 = range.to.getTime();
    const x = d.getTime();
    return x > Math.min(t0,t1) && x < Math.max(t0,t1);
  };
  const isEdge = (d: Date) => (range.from && sameDay(d, range.from)) || (range.to && sameDay(d, range.to));

  return (
    <div>
      <div className="flex items-center justify-center gap-6 mb-1.5">
        <button onClick={() => setMonth(addMonths(month, -1))} aria-label="이전 달" className="p-1 text-foreground/70">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[14px] font-extrabold text-foreground tabular-nums">{format(month, "yyyy.MM")}</span>
        <button onClick={() => setMonth(addMonths(month, 1))} aria-label="다음 달" className="p-1 text-foreground/70">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground mb-0.5">
        {WEEK.map((w) => <div key={w} className="py-0.5">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = sameDay(d, t);
          const edge = isEdge(d);
          const mid = isInRange(d);
          const future = d.getTime() > t.getTime();
          return (
            <div key={i} className="relative flex items-center justify-center h-7">
              {mid && <span className="absolute inset-y-0.5 inset-x-0 bg-primary/10" />}
              <button
                disabled={future}
                onClick={() => onPick(d)}
                className={`relative z-10 w-7 h-7 rounded-full text-[12px] tabular-nums flex items-center justify-center transition-colors
                  ${edge ? "bg-primary text-primary-foreground font-extrabold" : ""}
                  ${!edge && isToday ? "ring-1 ring-primary text-primary font-bold" : ""}
                  ${!edge && !isToday && inMonth ? "text-foreground" : ""}
                  ${!inMonth ? "text-muted-foreground/40" : ""}
                  ${future ? "opacity-30" : ""}
                `}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- main sheet ---------- */
const parseInput = (s: string): Date | null => {
  const m = s.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (isNaN(d.getTime()) || d.getMonth() !== +m[2]-1) return null;
  d.setHours(0,0,0,0);
  return d;
};

const PeriodSheet = ({ open, onOpenChange, selected, onSelect }: Props) => {
  const [mode, setMode] = useState<"calendar" | "manual">("calendar");
  const [month, setMonth] = useState<Date>(today());
  const [from, setFrom] = useState<Date | undefined>(today());
  const [to, setTo] = useState<Date | undefined>(today());
  const [fromStr, setFromStr] = useState(fmtInput(today()));
  const [toStr, setToStr] = useState(fmtInput(today()));
  const [activeChip, setActiveChip] = useState<ChipKey | null>("today");

  // sync when opened
  useEffect(() => {
    if (!open) return;
    if (selected === "manual") setMode("manual");
    else setMode("calendar");
    if (selected !== "custom" && selected !== "manual") {
      const v = buildPeriodValue(selected);
      setFrom(v.range!.from); setTo(v.range!.to);
      setFromStr(fmtInput(v.range!.from)); setToStr(fmtInput(v.range!.to));
      setActiveChip(selected as ChipKey);
      setMonth(v.range!.to);
    }
  }, [open, selected]);

  const pickDate = (d: Date) => {
    // if already a range or new start, reset
    if (!from || (from && to && !sameDay(from, to))) {
      setFrom(d); setTo(d); setActiveChip(null);
      return;
    }
    if (from && sameDay(from, to!)) {
      // extend to range (or same)
      if (d.getTime() < from.getTime()) { setFrom(d); setTo(from); }
      else { setTo(d); }
      setActiveChip(null);
      return;
    }
  };

  const pickChip = (k: ChipKey) => {
    if (k === "manual") {
      setMode("manual"); setActiveChip("manual");
      if (from) setFromStr(fmtInput(from));
      if (to) setToStr(fmtInput(to));
      return;
    }
    const v = buildPeriodValue(k);
    setFrom(v.range!.from); setTo(v.range!.to);
    setFromStr(fmtInput(v.range!.from)); setToStr(fmtInput(v.range!.to));
    setActiveChip(k);
    setMode("calendar");
    setMonth(v.range!.to);
  };

  const manualParsed = useMemo(() => {
    const f = parseInput(fromStr); const tt = parseInput(toStr);
    if (!f || !tt) return { ok: false, err: "날짜 형식을 확인해 주세요." };
    if (f.getTime() > tt.getTime()) return { ok: false, err: "시작일은 종료일보다 늦을 수 없어요." };
    return { ok: true as const, from: f, to: tt };
  }, [fromStr, toStr]);

  const canApply = mode === "calendar" ? !!(from && to) : manualParsed.ok;

  const apply = () => {
    if (mode === "manual") {
      if (!manualParsed.ok) return;
      onSelect({
        key: "manual",
        label: formatCustomLabel(manualParsed.from, manualParsed.to),
        range: { from: manualParsed.from, to: manualParsed.to },
      });
      onOpenChange(false);
      return;
    }
    if (!from || !to) return;
    if (activeChip && activeChip !== "manual") {
      onSelect(buildPeriodValue(activeChip as Exclude<ChipKey, "manual">));
    } else {
      onSelect({ key: "custom", label: formatCustomLabel(from, to), range: { from, to } });
    }
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col h-full px-4 pt-1 pb-[max(env(safe-area-inset-bottom),12px)]">
          {/* header */}
          <div className="flex items-center justify-center relative py-1.5">
            <h3 className="text-[15px] font-extrabold text-foreground">기간 선택</h3>
            <button onClick={() => onOpenChange(false)} aria-label="닫기" className="absolute right-0 text-muted-foreground p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* body */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {mode === "calendar" ? (
              <CalendarGrid
                month={month}
                setMonth={setMonth}
                range={{ from, to }}
                onPick={pickDate}
              />
            ) : (
              <div className="pt-1 space-y-3">
                <div>
                  <label className="text-[12px] font-bold text-foreground/80">시작일</label>
                  <div className="mt-1 relative">
                    <input
                      value={fromStr}
                      onChange={(e) => { setFromStr(e.target.value); setActiveChip("manual"); }}
                      placeholder="YYYY.MM.DD"
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 pr-9 text-[13px] tabular-nums text-foreground focus:outline-none focus:border-primary"
                    />
                    <CalendarIcon className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-foreground/80">종료일</label>
                  <div className="mt-1 relative">
                    <input
                      value={toStr}
                      onChange={(e) => { setToStr(e.target.value); setActiveChip("manual"); }}
                      placeholder="YYYY.MM.DD"
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 pr-9 text-[13px] tabular-nums text-foreground focus:outline-none focus:border-primary"
                    />
                    <CalendarIcon className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="rounded-lg bg-primary/8 border border-primary/15 px-2.5 py-2 flex items-start gap-1.5" style={{ backgroundColor: "hsl(var(--primary) / 0.06)" }}>
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-px" />
                  <p className="text-[11px] text-foreground/80 leading-relaxed">
                    {manualParsed.ok ? "직접 날짜를 입력하여 조회할 수 있어요." : manualParsed.err}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* chips */}
          <div className="flex gap-1.5 overflow-x-auto py-2 -mx-1 px-1 no-scrollbar">
            {CHIPS.map((c) => (
              <Chip key={c.key} active={activeChip === c.key} onClick={() => pickChip(c.key)}>{c.label}</Chip>
            ))}
          </div>

          {/* apply */}
          <button
            onClick={apply}
            disabled={!canApply}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[14px] font-extrabold disabled:opacity-40"
          >
            적용하기
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PeriodSheet;
