import { Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

export interface SortOption<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  options: SortOption<T>[];
  selected: T;
  onSelect: (key: T) => void;
}

const SortSheet = <T extends string>({
  open,
  onOpenChange,
  title = "정렬 기준",
  options,
  selected,
  onSelect,
}: Props<T>) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div
          className="flex flex-col px-5 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]"
          style={{ height: 380 }}
        >
          <div className="shrink-0 pt-1">
            <h3 className="text-[16px] font-extrabold text-foreground text-center leading-tight">
              {title}
            </h3>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto mt-3 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {options.map((opt) => {
              const sel = opt.key === selected;
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    onSelect(opt.key);
                    onOpenChange(false);
                  }}
                  className={`w-full min-h-12 flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border-2 transition-all ${
                    sel ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      sel ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}
                  >
                    {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                  <span
                    className={`text-[15px] font-bold ${
                      sel ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SortSheet;