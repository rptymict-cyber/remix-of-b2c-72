import { useMemo, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { CROPS } from "@/data/catalog";
import { useApp } from "@/store/appStore";
import { Check, Search } from "lucide-react";

// 작물 추가 화면 대표 작물 순서 (전체 탭 노출 기준)
const REPRESENTATIVE_ORDER = [
  "벼", "배추", "무", "마늘", "양파", "고추", "사과", "배", "감자",
  "고구마", "콩", "대파", "감귤", "복숭아", "수박", "딸기", "토마토", "상추",
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}
const CropSheet = ({ open, onOpenChange }: Props) => {
  const { cropId, setCrop, profile } = useApp();
  const [tab, setTab] = useState<"my" | "all">("my");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    if (tab === "my") return CROPS.filter((c) => profile.myCrops.includes(c.id));
    if (q.trim()) return CROPS.filter((c) => c.name.includes(q.trim()));
    // 대표 작물 순서대로 정렬해서 노출
    const byName = new Map(CROPS.map((c) => [c.name, c]));
    return REPRESENTATIVE_ORDER.map((n) => byName.get(n)).filter(Boolean) as typeof CROPS;
  }, [tab, q, profile.myCrops]);

  const select = (id: string) => {
    const c = CROPS.find((x) => x.id === id)!;
    setCrop(id, c.varieties[0]);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6 h-[60vh] min-h-[480px] max-h-[75vh]">
        <div className="pt-2 flex flex-col h-full min-h-0">
          <h3 className="text-base font-bold text-foreground text-center mb-3 shrink-0">작물 선택</h3>
          <div className="flex gap-2 mb-3 shrink-0">
            {(["my", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg ${tab === t ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
              >
                {t === "my" ? "내 작물" : "전체"}
              </button>
            ))}
          </div>
          {tab === "all" && (
            <div className="relative mb-3 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="작물 이름 검색"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background"
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 flex-1 min-h-0 overflow-y-auto pb-2 content-start">
            {list.map((c) => {
              const sel = c.id === cropId;
              return (
                <button
                  key={c.id}
                  onClick={() => select(c.id)}
                  className={`relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl border ${sel ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{c.name}</span>
                  {sel && <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
            {list.length === 0 && (
              <p className="col-span-3 text-center text-xs text-muted-foreground py-6">검색 결과가 없습니다</p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
export default CropSheet;