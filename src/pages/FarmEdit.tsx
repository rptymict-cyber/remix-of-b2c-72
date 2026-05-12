import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, MapPin, Search, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import MobileStatusBar from "@/components/MobileStatusBar";
import { useApp } from "@/store/appStore";
import { CROPS, REGIONS_KR, findCrop } from "@/data/catalog";
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
const AI_CROPS = new Set(["pepper", "apple", "cabbage", "onion", "radish"]);

const sizePresets = [
  { label: "1,000㎡ 미만", min: 0, max: 999, value: 800 },
  { label: "1,000~3,000㎡", min: 1000, max: 3000, value: 2000 },
  { label: "3,000~5,000㎡", min: 3001, max: 5000, value: 4000 },
  { label: "5,000㎡ 이상", min: 5001, max: Infinity, value: 6000 },
];

// 시·도 + 시·군·구를 region 문자열에서 역추정
const guessRegionParts = (region: string): { province: string; city: string } => {
  const parts = region.split(" ");
  if (parts.length < 2) return { province: "", city: "" };
  const cityPart = parts[1];
  const provincePart = parts[0];
  const province =
    Object.keys(REGIONS_KR).find(
      (p) => p.startsWith(provincePart) || provincePart.includes(p.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "")),
    ) || "";
  return { province, city: cityPart };
};

const shortenProvince = (p: string) =>
  p.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "");

const FarmEdit = () => {
  const nav = useNavigate();
  const { profile, setProfile } = useApp();

  // ---------- Region ----------
  const initialParts = guessRegionParts(profile.region);
  const [province, setProvinceState] = useState(initialParts.province);
  const [city, setCity] = useState(initialParts.city);
  const region = province && city ? `${shortenProvince(province)} ${city}` : profile.region;

  // ---------- Size ----------
  const [unit, setUnit] = useState<"평" | "㎡">("㎡");
  const [sizeInput, setSizeInput] = useState(String(profile.farmAreaM2));

  const sizeM2 = useMemo(() => {
    const n = Number(sizeInput.replace(/,/g, ""));
    if (!n) return 0;
    return unit === "평" ? Math.round(n * 3.306) : n;
  }, [sizeInput, unit]);
  const expectedYieldKg = Math.round(sizeM2 * 0.3);

  // ---------- Crops ----------
  const [myCrops, setMyCrops] = useState<string[]>(profile.myCrops);
  const [cropSheetOpen, setCropSheetOpen] = useState(false);
  const [cropQuery, setCropQuery] = useState("");

  // ---------- Confirm leave ----------
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirty =
    region !== profile.region ||
    sizeM2 !== profile.farmAreaM2 ||
    myCrops.length !== profile.myCrops.length ||
    myCrops.some((id, i) => id !== profile.myCrops[i]);

  const cities = province ? REGIONS_KR[province] || [] : [];

  const handleBack = () => {
    if (dirty) setConfirmOpen(true);
    else nav(-1);
  };

  const handleSave = () => {
    if (!dirty) return;
    const farmSize: "소규모" | "중규모" | "대규모" =
      sizeM2 < 1000 ? "소규모" : sizeM2 < 5000 ? "중규모" : "대규모";
    setProfile({
      region,
      farmAreaM2: sizeM2,
      farmSize,
      myCrops,
    });
    toast.success("농장 정보가 업데이트됐어요");
    nav("/mypage");
  };

  const removeCrop = (id: string) => setMyCrops((prev) => prev.filter((x) => x !== id));

  const filteredCrops = CROPS.filter((c) => c.name.includes(cropQuery.trim()));
  const aiList = filteredCrops.filter((c) => AI_CROPS.has(c.id));
  const restList = filteredCrops.filter((c) => !AI_CROPS.has(c.id));

  const toggleCropPick = (id: string) => {
    if (myCrops.includes(id)) return;
    if (myCrops.length >= 3) {
      toast("최대 3개까지 등록 가능합니다");
      return;
    }
    setMyCrops((prev) => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MobileStatusBar />
      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white border-b border-border">
        <div className="h-12 flex items-center justify-between px-2">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center"
            aria-label="뒤로"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-[15px] font-bold text-foreground">내 농장 정보</h1>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={`w-12 h-10 text-[14px] font-bold ${
              dirty ? "text-[hsl(152_55%_42%)]" : "text-muted-foreground"
            }`}
          >
            저장
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-32 space-y-8">
        {/* === 농장 위치 === */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-foreground">농장 위치</h2>
              <p className="text-[12px] text-muted-foreground mt-1">
                시세 조회와 판매처 추천의 기준 지역입니다
              </p>
            </div>
            <button
              onClick={() => {
                setProvinceState("충청남도");
                setCity("공주시");
                toast("현재 위치로 설정했어요");
              }}
              className="text-[12px] text-[hsl(152_55%_42%)] font-semibold inline-flex items-center gap-0.5"
            >
              <MapPin className="w-3.5 h-3.5" /> 현재 위치로 변경
            </button>
          </div>

          <div
            className="mt-3 rounded-xl border-2 px-4 py-3.5 flex items-center gap-2"
            style={{ borderColor: PRIMARY, background: "hsl(152 55% 42% / 0.04)" }}
          >
            <MapPin className="w-4 h-4 text-[hsl(152_55%_42%)]" />
            <span className="text-[14px] font-semibold text-foreground">
              {region || "지역을 선택해주세요"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="relative">
              <select
                value={province}
                onChange={(e) => {
                  setProvinceState(e.target.value);
                  setCity("");
                }}
                className={`w-full h-11 pl-3 pr-9 rounded-xl border border-border bg-white text-[13px] appearance-none focus:outline-none focus:border-[hsl(152_55%_42%)] ${
                  province ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <option value="">시·도 선택</option>
                {Object.keys(REGIONS_KR).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={city}
                disabled={!province}
                onChange={(e) => setCity(e.target.value)}
                className={`w-full h-11 pl-3 pr-9 rounded-xl border border-border bg-white text-[13px] appearance-none focus:outline-none focus:border-[hsl(152_55%_42%)] disabled:opacity-60 ${
                  city ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <option value="">{province ? "시·군·구 선택" : "시·도 먼저 선택"}</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* === 농장 규모 === */}
        <section>
          <h2 className="text-[15px] font-bold text-foreground">농장 규모</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            예상 수확량과 출하량 계산의 기준이 됩니다
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                inputMode="numeric"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value.replace(/[^0-9,]/g, ""))}
                placeholder="농장 규모"
                className="w-full h-12 px-4 pr-10 rounded-xl border border-border bg-white text-[14px] focus:outline-none focus:border-[hsl(152_55%_42%)]"
              />
              {sizeInput && (
                <button
                  onClick={() => setSizeInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                  aria-label="지우기"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex rounded-xl border border-border overflow-hidden h-12">
              {(["평", "㎡"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => {
                    if (u === unit) return;
                    const raw = Number(sizeInput.replace(/,/g, ""));
                    if (raw > 0) {
                      const converted = u === "㎡" ? raw * 3.306 : raw / 3.306;
                      setSizeInput(String(Math.round(converted)));
                    }
                    setUnit(u);
                  }}
                  className={`w-12 text-[13px] font-medium ${
                    unit === u
                      ? "bg-[hsl(152_55%_42%)] text-white"
                      : "bg-white text-muted-foreground"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {sizeM2 > 0 && (
            <p className="mt-3 text-[12.5px] text-[hsl(152_55%_42%)] font-medium">
              약 {sizeM2.toLocaleString()}㎡ · 고추 기준 예상 수확량 약{" "}
              {expectedYieldKg.toLocaleString()}kg
            </p>
          )}

          <p className="mt-5 text-[12px] text-muted-foreground mb-2">빠른 선택</p>
          <div className="grid grid-cols-2 gap-2">
            {sizePresets.map((p) => {
              const active = sizeM2 >= p.min && sizeM2 <= p.max;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    setUnit("㎡");
                    setSizeInput(String(p.value));
                  }}
                  className={`h-12 rounded-xl border text-[13px] font-medium ${
                    active
                      ? "border-[hsl(152_55%_42%)] bg-[hsl(152_55%_42%)]/8 text-[hsl(152_55%_42%)]"
                      : "border-border bg-white text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* === 재배 작물 === */}
        <section>
          <h2 className="text-[15px] font-bold text-foreground">재배 작물</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            최대 3개까지 등록 가능합니다
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {myCrops.map((id) => {
              const c = findCrop(id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 h-9 pl-2.5 pr-1.5 rounded-full bg-[hsl(152_55%_42%)]/10 text-[13px] text-[hsl(152_55%_42%)] font-semibold"
                >
                  <span className="text-base leading-none">{c.emoji}</span>
                  {c.name}
                  <button
                    onClick={() => removeCrop(id)}
                    className="w-5 h-5 ml-0.5 rounded-full bg-white/60 flex items-center justify-center"
                    aria-label={`${c.name} 삭제`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {myCrops.length < 3 && (
              <button
                onClick={() => {
                  setCropQuery("");
                  setCropSheetOpen(true);
                }}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-dashed border-[hsl(152_55%_42%)] text-[13px] text-[hsl(152_55%_42%)] font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> 작물 추가
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Bottom save */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-[430px] bg-white border-t border-border px-5 pt-3 pb-6">
        <button
          onClick={handleSave}
          disabled={!dirty}
          className="w-full h-[52px] rounded-2xl bg-[hsl(152_55%_42%)] text-white text-[15px] font-bold disabled:bg-muted disabled:text-muted-foreground transition active:scale-[0.99]"
        >
          저장하기
        </button>
      </div>

      {/* Crop add sheet */}
      <Sheet open={cropSheetOpen} onOpenChange={setCropSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-[430px] rounded-t-[20px] p-0 max-h-[80vh] flex flex-col"
        >
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-[16px] font-bold text-left">작물 추가</SheetTitle>
          </SheetHeader>
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={cropQuery}
                onChange={(e) => setCropQuery(e.target.value)}
                placeholder="작물 이름 검색"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-white text-[13px] focus:outline-none focus:border-[hsl(152_55%_42%)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6">
            {aiList.length > 0 && (
              <div className="mb-5">
                <p className="text-[12px] font-semibold text-foreground mb-2">AI 예측 지원 작물</p>
                <CropPickGrid crops={aiList} myCrops={myCrops} onPick={toggleCropPick} aiSet={AI_CROPS} />
              </div>
            )}
            {restList.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-foreground mb-2">전체 작물</p>
                <CropPickGrid crops={restList} myCrops={myCrops} onPick={toggleCropPick} aiSet={AI_CROPS} />
              </div>
            )}
          </div>

          <div className="px-5 pt-3 pb-6 border-t border-border">
            <button
              onClick={() => setCropSheetOpen(false)}
              className="w-full h-12 rounded-2xl bg-[hsl(152_55%_42%)] text-white text-[14px] font-bold"
            >
              완료
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Leave-confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
              onClick={() => setConfirmOpen(false)}
              className="flex-1 h-11 rounded-xl bg-muted text-foreground text-[13px] font-bold"
            >
              계속 수정하기
            </button>
            <button
              onClick={() => {
                setConfirmOpen(false);
                nav(-1);
              }}
              className="flex-1 h-11 rounded-xl bg-[hsl(152_55%_42%)] text-white text-[13px] font-bold"
            >
              나가기
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CropPickGrid = ({
  crops,
  myCrops,
  onPick,
  aiSet,
}: {
  crops: typeof CROPS;
  myCrops: string[];
  onPick: (id: string) => void;
  aiSet: Set<string>;
}) => (
  <div className="grid grid-cols-3 gap-2">
    {crops.map((c) => {
      const already = myCrops.includes(c.id);
      const isAI = aiSet.has(c.id);
      return (
        <button
          key={c.id}
          onClick={() => onPick(c.id)}
          disabled={already}
          className={`relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition ${
            already
              ? "border-[hsl(152_55%_42%)] bg-[hsl(152_55%_42%)]/8 opacity-70"
              : "border-border bg-white"
          }`}
        >
          <span className="text-2xl">{c.emoji}</span>
          <span className="text-[12px] font-medium text-foreground">{c.name}</span>
          {isAI && (
            <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(152_55%_42%)] text-white font-bold">
              AI예측
            </span>
          )}
          {already && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[hsl(152_55%_42%)] flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </span>
          )}
          {already && (
            <span className="absolute bottom-1.5 text-[9px] text-muted-foreground">등록됨</span>
          )}
        </button>
      );
    })}
  </div>
);

export default FarmEdit;