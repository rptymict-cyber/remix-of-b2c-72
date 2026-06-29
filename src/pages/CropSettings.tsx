import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, Store, Pencil, Check, Search } from "lucide-react";
import { toast } from "sonner";
import MobileStatusBar from "@/components/MobileStatusBar";
import { useApp, type CropRegType } from "@/store/appStore";
import { CROPS, MARKETS, REGION_GROUPS, REGIONS_KR, findCrop, findMarket } from "@/data/catalog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const PRIMARY = "hsl(152 55% 42%)";

const shortenProvince = (p: string) =>
  p.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "");

const guessRegionParts = (region: string): { province: string; city: string } => {
  const parts = region.split(" ");
  if (parts.length < 2) return { province: "", city: "" };
  const cityPart = parts[1];
  const provincePart = parts[0];
  const province =
    Object.keys(REGIONS_KR).find(
      (p) =>
        p.startsWith(provincePart) ||
        provincePart.includes(p.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "")),
    ) || "";
  return { province, city: cityPart };
};

const CropSettings = () => {
  const nav = useNavigate();
  const { id = "" } = useParams();
  const { profile, marketId, setCropSetting, removeMyCrop } = useApp();

  const crop = useMemo(() => findCrop(id), [id]);
  const initial = profile.cropSettings?.[id] ?? {
    regType: "growing" as CropRegType,
    region: profile.region,
    marketId,
  };

  const [regType, setRegType] = useState<CropRegType>(initial.regType);
  const [region, setRegion] = useState(initial.region);
  const [marketSel, setMarketSel] = useState(initial.marketId);

  const [regionOpen, setRegionOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty =
    regType !== initial.regType ||
    region !== initial.region ||
    marketSel !== initial.marketId;

  const handleBack = () => {
    if (dirty) setConfirmLeave(true);
    else nav(-1);
  };

  const handleSave = () => {
    if (!dirty) {
      nav("/farm-edit");
      return;
    }
    setCropSetting(id, { regType, region, marketId: marketSel });
    toast.success(`${crop.name} 설정이 업데이트됐어요`);
    nav("/farm-edit");
  };

  const handleRegTypeChange = (next: CropRegType) => {
    if (next === regType) return;
    setRegType(next);
    if (next === "interest") {
      toast("관심 작물로 변경 시 AI 예측과 출하 추천이 해제됩니다");
    } else {
      toast("재배 중인 작물로 변경 시 AI 예측과 출하 추천이 활성화됩니다");
    }
  };

  const handleDelete = () => {
    removeMyCrop(id);
    setConfirmDelete(false);
    toast.success(`${crop.name}이(가) 내 작물에서 삭제됐어요`);
    nav("/farm-edit");
  };

  const market = findMarket(marketSel);
  const isInterest = regType === "interest";

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <header className="fixed top-0 left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 bg-white border-b border-border">
        <MobileStatusBar />
        <div className="h-12 flex items-center justify-between px-2">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center"
            aria-label="뒤로"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex flex-col items-center leading-tight">
            <h1 className="text-[15px] font-bold text-foreground">작물 설정</h1>
            <p className="text-[11px] text-muted-foreground">
              {crop.emoji} {crop.name}
            </p>
          </div>
          <button
            onClick={handleSave}
            className={`w-12 h-10 text-[14px] font-bold ${
              dirty ? "text-[hsl(152_55%_42%)]" : "text-muted-foreground"
            }`}
          >
            저장
          </button>
        </div>
      </header>

      <main className="h-full overflow-y-auto px-5 pt-[calc(var(--app-header-compact-height)+1rem)] pb-32 space-y-7">
        {/* 선택한 작물 */}
        <section>
          <div
            className="rounded-2xl border-2 px-4 py-3.5 flex items-center justify-between"
            style={{ borderColor: PRIMARY, background: "hsl(152 55% 42% / 0.05)" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl leading-none">{crop.emoji}</span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">선택한 작물</p>
                <p className="text-[14px] font-bold text-foreground truncate">
                  {crop.name} · 전체 품종
                </p>
              </div>
            </div>
            <button
              onClick={() => nav("/crop/add", { state: { returnTo: window.location.pathname + window.location.search } })}
              className="text-[12px] font-semibold text-[hsl(152_55%_42%)] inline-flex items-center gap-1 shrink-0"
            >
              <Pencil className="w-3 h-3" /> 변경
            </button>
          </div>
        </section>

        {/* 등록 유형 */}
        <section>
          <h2 className="text-[15px] font-bold text-foreground">등록 유형</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            이 작물을 어떤 목적으로 사용할지 선택해주세요
          </p>
          <div className="mt-3 space-y-2">
            <TypeOption
              active={regType === "growing"}
              onClick={() => handleRegTypeChange("growing")}
              title="재배 중인 작물"
              desc="시세 예측과 출하 추천에 활용됩니다"
            />
            <TypeOption
              active={regType === "interest"}
              onClick={() => handleRegTypeChange("interest")}
              title="관심 작물"
              desc="시세 흐름을 확인하는 데 활용됩니다"
            />
          </div>
        </section>

        {/* 재배 지역 */}
        <section className={isInterest ? "opacity-50 pointer-events-none" : ""}>
          <h2 className="text-[15px] font-bold text-foreground">재배 지역</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            향후 10일 기상이 이 지역 기준으로 AI 예측에 반영됩니다
          </p>
          <div className="mt-3 rounded-2xl border border-border bg-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[hsl(152_55%_42%)]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[hsl(152_55%_42%)]" />
              </div>
              <p className="text-[14px] font-bold text-foreground truncate">{region}</p>
            </div>
            <button
              onClick={() => setRegionOpen(true)}
              className="text-[12px] font-semibold text-[hsl(152_55%_42%)] shrink-0"
            >
              지역 변경
            </button>
          </div>
          {isInterest && (
            <p className="text-[11px] text-muted-foreground mt-2">
              재배 중인 작물로 변경 시 설정 가능합니다
            </p>
          )}
        </section>

        {/* 기준 시장 */}
        <section className={isInterest ? "opacity-50 pointer-events-none" : ""}>
          <h2 className="text-[15px] font-bold text-foreground">기준 시장</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            홈·시세·예측 화면에서 이 작물의 기본 시세 기준으로 사용됩니다
          </p>
          <div className="mt-3 rounded-2xl border border-border bg-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[hsl(152_55%_42%)]/10 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-[hsl(152_55%_42%)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-foreground truncate">{market.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{market.region}</p>
              </div>
            </div>
            <button
              onClick={() => setMarketOpen(true)}
              className="text-[12px] font-semibold text-[hsl(152_55%_42%)] shrink-0"
            >
              시장 변경
            </button>
          </div>
        </section>

        {/* 작물 삭제 */}
        <section className="pt-2">
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-center text-[13px] font-semibold text-red-500 py-2"
          >
            이 작물 삭제
          </button>
        </section>
      </main>

      {/* 하단 저장 */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-[430px] bg-white border-t border-border px-5 pt-3 pb-6">
        <button
          onClick={handleSave}
          className="w-full h-[52px] rounded-2xl bg-[hsl(152_55%_42%)] text-white text-[15px] font-bold transition active:scale-[0.99]"
        >
          저장하기
        </button>
      </div>

      {/* 지역 선택 시트 */}
      <RegionSheet
        open={regionOpen}
        onOpenChange={setRegionOpen}
        currentRegion={region}
        onSelect={(r) => {
          setRegion(r);
          setRegionOpen(false);
        }}
      />

      {/* 시장 선택 시트 */}
      <MarketSheet
        open={marketOpen}
        onOpenChange={setMarketOpen}
        currentId={marketSel}
        onSelect={(mid) => {
          setMarketSel(mid);
          setMarketOpen(false);
        }}
      />

      {/* 떠나기 확인 */}
      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-left">
              변경사항이 저장되지 않았습니다
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground text-left">
              페이지를 나가면 수정한 내용이 사라집니다
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2 sm:justify-between">
            <button
              onClick={() => setConfirmLeave(false)}
              className="flex-1 h-11 rounded-xl bg-muted text-foreground text-[13px] font-bold"
            >
              계속 수정하기
            </button>
            <button
              onClick={() => {
                setConfirmLeave(false);
                nav(-1);
              }}
              className="flex-1 h-11 rounded-xl bg-[hsl(152_55%_42%)] text-white text-[13px] font-bold"
            >
              나가기
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-left">
              {crop.name}을(를) 삭제할까요?
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground text-left">
              삭제 시 이 작물의 시세·예측 데이터가 모두 해제됩니다
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2 sm:justify-between">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 h-11 rounded-xl bg-muted text-foreground text-[13px] font-bold"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 h-11 rounded-xl bg-red-500 text-white text-[13px] font-bold"
            >
              삭제
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TypeOption = ({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all ${
      active ? "border-[hsl(152_55%_42%)] bg-[hsl(152_55%_42%)]/5" : "border-border bg-white"
    }`}
  >
    <div className="flex items-center justify-between">
      <p className="text-[14px] font-bold text-foreground">{title}</p>
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          active ? "border-[hsl(152_55%_42%)] bg-[hsl(152_55%_42%)]" : "border-border"
        }`}
      >
        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
    </div>
    <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
  </button>
);

const RegionSheet = ({
  open,
  onOpenChange,
  currentRegion,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentRegion: string;
  onSelect: (region: string) => void;
}) => {
  const initial = guessRegionParts(currentRegion);
  const [province, setProvince] = useState(initial.province);
  const cities = province ? REGIONS_KR[province] || [] : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-[430px] rounded-t-[20px] p-0 h-[380px] flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-[16px] font-bold text-left">재배 지역 선택</SheetTitle>
        </SheetHeader>
        <div className="flex-1 grid grid-cols-2 overflow-hidden border-t border-border">
          <div className="overflow-y-auto border-r border-border scrollbar-hide">
            {Object.keys(REGIONS_KR).map((p) => (
              <button
                key={p}
                onClick={() => setProvince(p)}
                className={`w-full text-left px-4 py-3 text-[13px] ${
                  province === p
                    ? "bg-[hsl(152_55%_42%)]/8 text-[hsl(152_55%_42%)] font-bold"
                    : "text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto scrollbar-hide">
            {cities.length === 0 ? (
              <p className="text-[12px] text-muted-foreground px-4 py-3">시·도를 선택하세요</p>
            ) : (
              cities.map((c) => {
                const value = `${shortenProvince(province)} ${c}`;
                const sel = value === currentRegion;
                return (
                  <button
                    key={c}
                    onClick={() => onSelect(value)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-[13px] ${
                      sel
                        ? "bg-[hsl(152_55%_42%)]/8 text-[hsl(152_55%_42%)] font-bold"
                        : "text-foreground"
                    }`}
                  >
                    {c}
                    {sel && <Check className="w-4 h-4" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const MarketSheet = ({
  open,
  onOpenChange,
  currentId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentId: string;
  onSelect: (id: string) => void;
}) => {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<(typeof REGION_GROUPS)[number]>("전체");

  const filtered = MARKETS.filter((m) => {
    const okGroup = group === "전체" || m.regionGroup === group;
    const okQ = !q.trim() || m.name.includes(q.trim());
    return okGroup && okQ;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-[430px] rounded-t-[20px] p-0 h-[380px] flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-[16px] font-bold text-left">기준 시장 선택</SheetTitle>
        </SheetHeader>
        <div className="px-5 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="시장명 검색"
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white text-[13px] focus:outline-none focus:border-[hsl(152_55%_42%)]"
            />
          </div>
          <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
            {REGION_GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`shrink-0 px-3 h-7 rounded-full text-[11.5px] font-semibold border ${
                  group === g
                    ? "bg-[hsl(152_55%_42%)] text-white border-[hsl(152_55%_42%)]"
                    : "bg-white text-foreground border-border"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-5 space-y-1.5">
          {filtered.map((m) => {
            const sel = m.id === currentId;
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border ${
                  sel ? "border-[hsl(152_55%_42%)] bg-[hsl(152_55%_42%)]/5" : "border-border bg-white"
                }`}
              >
                <div className="text-left min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.region}</p>
                </div>
                {sel && <Check className="w-4 h-4 text-[hsl(152_55%_42%)] shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-[12px] text-muted-foreground py-6">검색 결과가 없습니다</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CropSettings;