import { useMemo, useState } from "react";
import { ChevronLeft, Search, Check, MapPin, Store, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/store/appStore";
import { MARKETS, findMarket } from "@/data/catalog";
import {
  ALL_CROPS,
  REPRESENTATIVE_CROPS,
  CATEGORIES,
  searchCrops,
  filterByCategory,
  findCropById,
  type CropCategory,
  type CropItem,
} from "@/data/cropCatalog";
import MobileStatusBar from "@/components/MobileStatusBar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

type RegType = "growing" | "interest";
const ALL_LABEL = "전체 품종";

const AddCrop = () => {
  const nav = useNavigate();
  const { profile, marketId, setMarket } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<CropCategory | "전체">("전체");
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  const [variety, setVariety] = useState<string>(ALL_LABEL);
  const [varOpen, setVarOpen] = useState(false);
  const [regType, setRegType] = useState<RegType>("growing");
  const [marketSel, setMarketSel] = useState<string>(marketId || "gwangju");
  const [marketOpen, setMarketOpen] = useState(false);

  const crop = selectedCropId ? findCropById(selectedCropId) : null;
  const market = findMarket(marketSel);

  // 검색 + 카테고리 필터
  const listed = useMemo(() => {
    const base = q.trim() ? searchCrops(q) : ALL_CROPS;
    return category === "전체" ? base : base.filter((c) => c.category === category);
  }, [q, category]);

  const showRepresentative = !q.trim() && category === "전체";
  const fullList = useMemo(() => filterByCategory(category), [category]);

  const handlePickCrop = (c: CropItem) => {
    setSelectedCropId(c.id);
    setVariety(ALL_LABEL);
    setVarOpen(true);
  };

  const goNext = () => {
    if (!selectedCropId) return;
    setStep(2);
  };

  const submit = () => {
    if (!crop) return;
    setMarket(marketSel);
    toast.success(`${crop.name}이(가) 내 작물에 추가되었습니다.`);
    nav("/crop");
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <MobileStatusBar />
        <div className="relative flex items-center justify-center h-14 px-4">
          <button
            onClick={() => (step === 2 ? setStep(1) : nav(-1))}
            className="absolute left-4 text-foreground"
            aria-label="뒤로"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-foreground">작물 추가</h1>
        </div>
        {/* progress */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {step}/2 {step === 1 ? "작물 선택" : "등록 정보 설정"}
          </span>
        </div>
      </header>

      {step === 1 ? (
        <main className="px-4 pt-5 space-y-4">
          <div>
            <h2 className="text-[18px] font-extrabold text-foreground leading-tight">
              <span className="text-primary">작물</span>을 선택해 주세요
            </h2>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
              시세와 예측을 확인할 작물을 선택하면<br />품종/품목을 함께 설정할 수 있습니다.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="작물 이름 검색"
              className="w-full pl-10 pr-3 py-3.5 text-sm rounded-2xl border border-border bg-card"
            />
          </div>

          {/* 카테고리 칩 */}
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 w-max pb-1">
              {(["전체", ...CATEGORIES] as const).map((cat) => {
                const sel = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap border transition-all ${
                      sel
                        ? "bg-primary text-white border-primary"
                        : "bg-card text-foreground border-border"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {crop && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{crop.icon}</span>
                <div>
                  <p className="text-[11px] text-muted-foreground">선택한 작물</p>
                  <p className="text-sm font-bold text-foreground">
                    {crop.name} · {variety}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVarOpen(true)}
                className="text-xs font-semibold text-primary flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                변경
              </button>
            </div>
          )}

          {/* 검색/카테고리 모드 */}
          {q.trim() || category !== "전체" ? (
            listed.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-foreground font-medium">검색 결과가 없습니다.</p>
                <p className="text-xs text-muted-foreground mt-1">다른 작물명으로 다시 검색해 주세요.</p>
              </div>
            ) : (
              <CropGrid items={listed} selectedId={selectedCropId} onPick={handlePickCrop} />
            )
          ) : (
            <>
              <div>
                <p className="text-[13px] font-bold text-foreground mb-3">대표 작물</p>
                <CropGrid items={REPRESENTATIVE_CROPS} selectedId={selectedCropId} onPick={handlePickCrop} />
              </div>
              <div className="pt-1">
                <p className="text-[13px] font-bold text-foreground mb-3">전체 작물</p>
                <CropGrid items={fullList} selectedId={selectedCropId} onPick={handlePickCrop} />
              </div>
            </>
          )}
          {showRepresentative && false}
        </main>
      ) : (
        <main className="px-4 pt-5 space-y-5">
          {/* 선택 요약 */}
          {crop && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{crop.icon}</span>
                <div>
                  <p className="text-[11px] text-muted-foreground">선택한 작물</p>
                  <p className="text-sm font-bold text-foreground">
                    {crop.name} · {variety}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-primary flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                변경
              </button>
            </div>
          )}

          <Section title="등록 유형" desc="이 작물을 어떤 목적으로 등록할지 선택해 주세요.">
            <div className="space-y-2">
              <TypeOption
                active={regType === "growing"}
                onClick={() => setRegType("growing")}
                title="재배 중인 작물"
                desc="시세 예측과 출하 추천에 활용됩니다."
              />
              <TypeOption
                active={regType === "interest"}
                onClick={() => setRegType("interest")}
                title="관심 작물"
                desc="시세 흐름을 확인하는 데 활용됩니다."
              />
            </div>
          </Section>

          <Section title="재배 지역" desc="이 지역의 기상 정보가 AI 예측에 반영됩니다.">
            <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{profile.region}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    향후 10일 기상이 이 지역 기준으로 반영됩니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => nav("/mypage")}
                className="text-xs font-semibold text-primary"
              >
                지역 변경
              </button>
            </div>
          </Section>

          <Section
            title="기준 시장"
            desc="홈, 시세, 예측 화면에서 기본으로 확인할 도매시장을 선택해 주세요."
          >
            <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{market.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{market.region}</p>
                </div>
              </div>
              <button
                onClick={() => setMarketOpen(true)}
                className="text-xs font-semibold text-primary"
              >
                시장 변경
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 px-1">
              선택한 시장은 작물별 기본 시세 기준으로 사용됩니다.
            </p>
          </Section>
        </main>
      )}

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border px-4 py-3 safe-bottom mx-auto max-w-[430px]">
        {step === 1 ? (
          <button
            onClick={goNext}
            disabled={!selectedCropId}
            className="w-full py-3.5 rounded-2xl bg-primary text-white text-[15px] font-bold disabled:opacity-40"
          >
            다음
          </button>
        ) : (
          <button
            onClick={submit}
            className="w-full py-3.5 rounded-2xl bg-primary text-white text-[15px] font-bold"
          >
            작물 추가하기
          </button>
        )}
      </div>

      {/* 품종/품목 시트 */}
      <Drawer open={varOpen} onOpenChange={setVarOpen}>
        <DrawerContent className="px-4 pb-6">
          <h3 className="text-base font-bold text-foreground text-center mb-3 pt-2">
            {crop ? `${crop.name} 품종 선택` : "품종 선택"}
          </h3>
          <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
            {crop &&
              [ALL_LABEL, ...crop.varieties].map((v) => {
                const sel = v === variety;
                return (
                  <button
                    key={v}
                    onClick={() => {
                      setVariety(v);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border ${
                      sel ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">{v}</span>
                    {sel && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
          </div>
          <button
            onClick={() => setVarOpen(false)}
            className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold"
          >
            선택 완료
          </button>
        </DrawerContent>
      </Drawer>

      {/* 시장 시트 */}
      <Drawer open={marketOpen} onOpenChange={setMarketOpen}>
        <DrawerContent className="px-4 pb-6">
          <h3 className="text-base font-bold text-foreground text-center mb-3 pt-2">기준 시장 선택</h3>
          <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
            {MARKETS.map((m) => {
              const sel = m.id === marketSel;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMarketSel(m.id);
                    setMarketOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${
                    sel ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">{m.region}</p>
                  </div>
                  {sel && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

const CropGrid = ({
  items,
  selectedId,
  onPick,
}: {
  items: CropItem[];
  selectedId: string;
  onPick: (c: CropItem) => void;
}) => (
  <div className="grid grid-cols-3 gap-x-3 gap-y-5">
    {items.map((c) => {
      const sel = selectedId === c.id;
      return (
        <button
          key={c.id}
          onClick={() => onPick(c)}
          className="flex flex-col items-center gap-2"
        >
          <div
            className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-[32px] border-2 transition-all ${
              sel
                ? "border-primary bg-primary/10 shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.4)]"
                : "border-border bg-card"
            }`}
          >
            {c.icon}
          </div>
          <span
            className={`text-[12px] font-semibold text-center leading-tight ${
              sel ? "text-primary" : "text-foreground"
            }`}
          >
            {c.name}
          </span>
        </button>
      );
    })}
  </div>
);

const Section = ({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) => (
  <section>
    <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
    {desc && (
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-2.5 leading-relaxed">{desc}</p>
    )}
    {children}
  </section>
);

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
      active ? "border-primary bg-primary/5" : "border-border bg-card"
    }`}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          active ? "border-primary bg-primary" : "border-border"
        }`}
      >
        {active && <Check className="w-3 h-3 text-white" />}
      </span>
    </div>
    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
  </button>
);

export default AddCrop;
