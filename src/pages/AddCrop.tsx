import { useMemo, useRef, useState } from "react";
import { ChevronLeft, Search, Check, MapPin, Store, Pencil, Scale, Bell } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useApp, MAX_MY_CROPS, type PriceDisplayMode } from "@/store/appStore";
import { MARKETS, findMarket, resolveRepresentativeId, findCrop } from "@/data/catalog";
import {
  ALL_CROPS,
  REPRESENTATIVE_CROPS,
  CATEGORIES,
  searchCrops,
  findCropById,
  type CropCategory,
  type CropItem,
} from "@/data/cropCatalog";
import MobileStatusBar from "@/components/MobileStatusBar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";

type RegType = "growing" | "interest";
const ALL_LABEL = "전체 품종";

// 마우스 드래그 + 터치 스와이프 가로 스크롤 래퍼
const DragScroller = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || !ref.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 5) {
      if (!drag.current.moved) {
        drag.current.moved = true;
        try {
          ref.current.setPointerCapture(e.pointerId);
        } catch {}
      }
      ref.current.scrollLeft = drag.current.startLeft - dx;
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    try {
      ref.current?.releasePointerCapture(e.pointerId);
    } catch {}
  };
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div
      ref={ref}
      className={`${className ?? ""} cursor-grab active:cursor-grabbing select-none`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
};

// 가격 환산 예시(고정 샘플): 32,000원 / 40kg
const SAMPLE_PRICE = 32000;
const SAMPLE_KG = 40;
const PRICE_MODES: { id: PriceDisplayMode; label: string; targetKg: number | null }[] = [
  { id: "actual", label: "실거래 단위", targetKg: null },
  { id: "1kg", label: "1kg 기준", targetKg: 1 },
  { id: "10kg", label: "10kg 기준", targetKg: 10 },
  { id: "20kg", label: "20kg 기준", targetKg: 20 },
  { id: "100kg", label: "100kg 기준", targetKg: 100 },
  { id: "default", label: "작물 기본 단위", targetKg: null },
];
const won = (n: number) => `${Math.round(n).toLocaleString()}원`;
const convertLabel = (mode: PriceDisplayMode, cropDefaultKg = SAMPLE_KG) => {
  if (mode === "actual") return `${won(SAMPLE_PRICE)} / ${SAMPLE_KG}kg`;
  if (mode === "default") return `${won(SAMPLE_PRICE)} / ${cropDefaultKg}kg`;
  const target = PRICE_MODES.find((m) => m.id === mode)?.targetKg ?? 1;
  return `${won((SAMPLE_PRICE / SAMPLE_KG) * target)} / ${target === 1 ? "kg" : `${target}kg`}`;
};
const modeShort = (mode: PriceDisplayMode) => {
  if (mode === "actual") return "실거래 단위";
  if (mode === "default") return "작물 기본 단위";
  const m = PRICE_MODES.find((m) => m.id === mode);
  return `${m?.targetKg ?? ""}kg 기준`;
};

const ALERT_RULES = [
  "가격이 전일 대비 ±5% 이상 변동",
  "거래량이 평소 대비 30% 이상 변동",
  "목표 가격 도달 시",
];

// 작물별 거래 단위 옵션 (대표 케이스 + 동적 생성)
type UnitOption = { kg: number; label: string; sublabel: string; price: number };
const PRICE_PER_KG = 2000; // 예시 환산용 단가
const getUnitOptions = (cropId: string, defaultUnitKg: number): UnitOption[] => {
  const basePrice = PRICE_PER_KG * defaultUnitKg;
  const perKg = PRICE_PER_KG;
  // 작물별 특수 케이스
  if (cropId === "pepper") {
    return [
      { kg: 0.6, label: "600g 봉지", sublabel: "소포장", price: Math.round(perKg * 0.6) },
      { kg: 1, label: "1kg", sublabel: "kg 단가", price: perKg },
      { kg: 10, label: "10kg 상자", sublabel: "대용량", price: perKg * 10 },
    ];
  }
  if (cropId === "onion") {
    return [
      { kg: 15, label: "15kg 망", sublabel: "기본 단위", price: perKg * 15 },
      { kg: 20, label: "20kg 망", sublabel: "대용량", price: perKg * 20 },
      { kg: 1, label: "1kg", sublabel: "kg 단가", price: perKg },
    ];
  }
  if (cropId === "cabbage") {
    return [
      { kg: 10, label: "10kg", sublabel: "기본 단위", price: perKg * 10 },
      { kg: 2, label: "1포기(2kg)", sublabel: "낱개", price: perKg * 2 },
      { kg: 1, label: "1kg", sublabel: "kg 단가", price: perKg },
    ];
  }
  return [
    { kg: defaultUnitKg, label: `${defaultUnitKg}kg`, sublabel: "기본 단위", price: basePrice },
    { kg: 1, label: "1kg", sublabel: "kg 단가", price: perKg },
    { kg: defaultUnitKg * 2, label: `${defaultUnitKg * 2}kg`, sublabel: "대용량", price: basePrice * 2 },
  ];
};

const AddCrop = () => {
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isInterest = searchParams.get("mode") === "interest";
  const rawReturnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const defaultReturn = isInterest ? "/watchlist?tab=interest" : "/watchlist?tab=mine";
  const returnTo = rawReturnTo && !rawReturnTo.startsWith("/crop/add") ? rawReturnTo : defaultReturn;
  const { profile, marketId, setMarket, addMyCrop, addInterestCrop, setCrop, setCropSetting } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<CropCategory | "전체">("전체");
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  const [varieties, setVarieties] = useState<string[]>([ALL_LABEL]);
  const [varOpen, setVarOpen] = useState(false);
  const [regType, setRegType] = useState<RegType>(isInterest ? "interest" : "growing");
  const [marketSel, setMarketSel] = useState<string>(marketId || "gwangju");
  const [marketOpen, setMarketOpen] = useState(false);
  const [priceMode, setPriceMode] = useState<PriceDisplayMode>("20kg");
  const [priceModeOpen, setPriceModeOpen] = useState(false);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertRules, setAlertRules] = useState<string[]>([ALERT_RULES[0]]);
  const [selectedUnitKg, setSelectedUnitKg] = useState<number | null>(null);
  const [selectedUnitLabel, setSelectedUnitLabel] = useState<string>("");

  const crop = selectedCropId ? findCropById(selectedCropId) : null;
  const market = findMarket(marketSel);
  const cropStableId = crop ? (resolveRepresentativeId(crop.id) ?? crop.id) : "";
  const cropMeta = cropStableId ? findCrop(cropStableId) : null;
  const cropDefaultUnitKg = cropMeta?.defaultUnitKg ?? 10;
  const cropBasePrice = PRICE_PER_KG * cropDefaultUnitKg;
  const unitOptions = useMemo(
    () => (cropStableId ? getUnitOptions(cropStableId, cropDefaultUnitKg) : []),
    [cropStableId, cropDefaultUnitKg]
  );

  // 검색어가 있으면 카테고리 필터 무시하고 전체 작물 기준 검색
  const listed = useMemo(() => {
    if (q.trim()) return searchCrops(q);
    if (category === "전체") return ALL_CROPS;
    return ALL_CROPS.filter((c) => c.category === category);
  }, [q, category]);

  const showRepresentative = !q.trim() && category === "전체";

  const handlePickCrop = (c: CropItem) => {
    if (c.id !== selectedCropId) {
      setVarieties([ALL_LABEL]);
    }
    setSelectedCropId(c.id);
    // 관심 품목 모드는 품종 Drawer 자동 오픈 X (가벼운 즐겨찾기 등록)
    if (!isInterest) setVarOpen(true);
  };

  const toggleVariety = (v: string) => {
    setVarieties((prev) => {
      if (v === ALL_LABEL) return [ALL_LABEL];
      const without = prev.filter((x) => x !== ALL_LABEL);
      const next = without.includes(v)
        ? without.filter((x) => x !== v)
        : [...without, v];
      return next.length === 0 ? [ALL_LABEL] : next;
    });
  };

  const toggleAlertRule = (r: string) => {
    setAlertRules((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const varietyLabel = (() => {
    if (varieties.length === 0 || varieties[0] === ALL_LABEL) return ALL_LABEL;
    if (varieties.length === 1) return varieties[0];
    if (varieties.length === 2) return varieties.join(", ");
    return `${varieties[0]} 외 ${varieties.length - 1}개`;
  })();

  const goNext = () => {
    if (!selectedCropId) return;
    setStep(2);
  };

  const submit = () => {
    if (!crop) return;
    const stableId = resolveRepresentativeId(crop.id) ?? crop.id;
    const displayName = findCrop(stableId).name;

    if (isInterest) {
      // 이미 내 작물로 등록된 경우 안내
      if (profile.myCrops.includes(stableId)) {
        toast("이미 내 작물로 등록된 품목이에요. 내 작물에서 확인할 수 있어요.");
        nav("/watchlist?tab=mine", { replace: true });
        return;
      }
      // 이미 관심 품목으로 등록된 경우 중복 방지
      if ((profile.interestCrops ?? []).includes(stableId)) {
        toast("이미 관심 품목에 등록된 품목이에요.");
        nav("/watchlist?tab=interest", { replace: true });
        return;
      }
      addInterestCrop(stableId);
      const finalVarieties = varieties.length === 0 ? [ALL_LABEL] : varieties;
      setCropSetting(stableId, {
        regType: "interest",
        region: profile.region,
        marketId: marketSel,
        selectedVarieties: finalVarieties,
        priceDisplayMode: priceMode,
        alertEnabled,
        alertRules: alertEnabled ? alertRules : [],
      });
      toast.success("관심 품목에 추가했어요.");
      nav("/watchlist?tab=interest", { replace: true });
      return;
    }

    const already = profile.myCrops.includes(stableId);
    if (!already && profile.myCrops.length >= MAX_MY_CROPS) {
      toast.error(`내 작물은 최대 ${MAX_MY_CROPS}개까지 등록할 수 있어요.`);
      return;
    }

    addMyCrop(stableId);
    const firstVar = varieties[0] === ALL_LABEL ? (crop.varieties?.[0] ?? ALL_LABEL) : varieties[0];
    setCrop(stableId, firstVar);
    setMarket(marketSel);
    setCropSetting(stableId, {
      regType,
      region: profile.region,
      marketId: marketSel,
      selectedVarieties: varieties,
      priceDisplayMode: priceMode,
      alertEnabled,
      alertRules: alertEnabled ? alertRules : [],
      unitKg: selectedUnitKg ?? cropDefaultUnitKg,
      unitLabel: selectedUnitLabel || `${cropDefaultUnitKg}kg`,
    });
    if (already) {
      toast("이미 등록된 작물이에요. 선택 작물로 이동했어요.");
    } else {
      toast.success(`${displayName}이(가) 내 작물에 추가됐어요`);
    }
    nav(returnTo, { replace: true });
  };


  return (
    <div className="h-full bg-background">
      <header className="fixed top-0 left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 bg-white/95 backdrop-blur-sm border-b border-border">
        <MobileStatusBar />
        <div className="relative flex items-center justify-center h-14 px-4">
          <button
            onClick={() => (step === 2 ? setStep(1) : (rawReturnTo ? nav(returnTo, { replace: true }) : nav(-1)))}
            className="absolute left-4 text-foreground"
            aria-label="뒤로"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-foreground">{isInterest ? "관심 품목 추가" : "작물 추가"}</h1>
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
            {step}/2 {step === 1 ? "품목 선택" : "조회 기준 설정"}
          </span>
        </div>
      </header>

      {step === 1 ? (
        <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-progress-height)+1.25rem)] pb-32 space-y-4">
          <div>
            <h2 className="text-[18px] font-extrabold text-foreground leading-tight">
              {isInterest ? (
                <><span className="text-primary">관심 품목</span>을 선택해 주세요</>
              ) : (
                <><span className="text-primary">작물</span>을 선택해 주세요</>
              )}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
              {isInterest
                ? "자주 확인할 품목을 선택하면 시세 흐름을 빠르게 볼 수 있어요."
                : <>시세와 예측을 확인할 작물을 선택하면<br />품종/품목을 함께 설정할 수 있습니다.</>}
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

          {/* 카테고리 칩 — 마우스 드래그 + 터치 스크롤 */}
          <DragScroller className="-mx-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 w-max px-4 pb-1">
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
          </DragScroller>

          {crop && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{crop.icon}</span>
                <div>
                  <p className="text-[11px] text-muted-foreground">{isInterest ? "선택한 품목" : "선택한 작물"}</p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                    {crop.name} · {varietyLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVarOpen(true)}
                className="text-xs font-semibold text-primary flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                품종 변경
              </button>
            </div>
          )}

          {showRepresentative ? (
            <div>
              <p className="text-[13px] font-bold text-foreground mb-3">대표 작물</p>
              <CropGrid items={REPRESENTATIVE_CROPS} selectedId={selectedCropId} onPick={handlePickCrop} />
            </div>
          ) : listed.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-foreground font-medium">검색 결과가 없습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">
                다른 작물명 또는 분류로 다시 검색해 주세요.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[13px] font-bold text-foreground mb-3">
                {q.trim() ? `검색 결과 (${listed.length})` : `${category} (${listed.length})`}
              </p>
              <CropGrid items={listed} selectedId={selectedCropId} onPick={handlePickCrop} />
            </div>
          )}
        </main>
      ) : (
        <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-progress-height)+1.25rem)] pb-32 space-y-5">
          {/* 선택 요약 */}
          {crop && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{crop.icon}</span>
                <div>
                  <p className="text-[11px] text-muted-foreground">{isInterest ? "선택한 품목" : "선택한 작물"}</p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                    {crop.name} · {varietyLabel}
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

          {!isInterest && (
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
          )}

          <Section
            title="거래 단위"
            desc="보통 어떤 단위로 거래하세요? 시세가 이 단위 기준으로 표시돼요."
          >
            <div className="grid grid-cols-3 gap-2">
              {unitOptions.map((opt) => {
                const sel = selectedUnitKg === opt.kg && selectedUnitLabel === opt.label;
                return (
                  <button
                    key={`${opt.label}-${opt.kg}`}
                    onClick={() => {
                      setSelectedUnitKg(opt.kg);
                      setSelectedUnitLabel(opt.label);
                    }}
                    className={`bg-card rounded-2xl py-3 px-2 text-center border-2 transition-all ${
                      sel ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <p className={`text-[15px] font-extrabold leading-tight ${sel ? "text-primary" : "text-foreground"}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-1.5">{opt.sublabel}</p>
                    <p className="text-[12px] font-bold text-destructive">
                      {opt.price.toLocaleString()}원
                    </p>
                  </button>
                );
              })}
            </div>
            {selectedUnitKg !== null && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5 flex items-center gap-2 mt-2">
                <span className="text-[18px]">⚖️</span>
                <span className="text-[12px] font-semibold text-primary">
                  ≒ {Math.round(cropBasePrice / selectedUnitKg).toLocaleString()}원/kg으로 환산해서 보여드려요
                </span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5">
              단위는 나중에 내 작물 설정에서 바꿀 수 있어요
            </p>
          </Section>



          {!isInterest && (
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
          )}

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

          <Section
            title="가격 표시 기준"
            desc="작물마다 거래 단위가 달라서, 같은 기준으로 환산해 비교할 수 있어요."
          >
            <div className="bg-card border border-border rounded-2xl px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{modeShort(priceMode)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      실거래가를 {modeShort(priceMode)}으로 환산해 보여드려요.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPriceModeOpen(true)}
                  className="text-xs font-semibold text-primary"
                >
                  기준 변경
                </button>
              </div>
              <div className="mt-3 px-3 py-2 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                <p className="text-[11px] text-foreground">
                  <span className="text-muted-foreground">예시 </span>
                  {won(SAMPLE_PRICE)} / {SAMPLE_KG}kg → <span className="font-bold text-primary">{convertLabel(priceMode)}</span>
                </p>
              </div>
            </div>
          </Section>

          <Section title="가격 알림 (선택)" desc="가격이 크게 변하면 알려드려요.">
            <div className="bg-card border border-border rounded-2xl px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">가격 변동 알림</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      가격이 크게 변하면 알려드려요.
                    </p>
                  </div>
                </div>
                <Switch checked={alertEnabled} onCheckedChange={setAlertEnabled} />
              </div>
              {alertEnabled && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {ALERT_RULES.map((r) => {
                    const sel = alertRules.includes(r);
                    return (
                      <button
                        key={r}
                        onClick={() => toggleAlertRule(r)}
                        className="w-full flex items-center justify-between"
                      >
                        <span className="text-[13px] text-foreground text-left">{r}</span>
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                            sel ? "border-primary bg-primary" : "border-border bg-card"
                          }`}
                        >
                          {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
            {isInterest
              ? "관심 품목 추가하기"
              : selectedUnitKg !== null
                ? "작물 추가하기"
                : "기본 단위로 추가하기"}
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
                const sel = varieties.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => toggleVariety(v)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border ${
                      sel ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">{v}</span>
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                        sel ? "border-primary bg-primary" : "border-border bg-card"
                      }`}
                    >
                      {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
          </div>
          <button
            onClick={() => setVarOpen(false)}
            disabled={varieties.length === 0}
            className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40"
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

      {/* 가격 표시 기준 시트 */}
      <Drawer open={priceModeOpen} onOpenChange={setPriceModeOpen}>
        <DrawerContent className="px-4 pb-6">
          <h3 className="text-base font-bold text-foreground text-center mb-1 pt-2">가격 표시 기준</h3>
          <p className="text-[12px] text-muted-foreground text-center mb-3">
            서로 다른 거래 단위를 같은 기준으로 환산해 비교할 수 있어요.
          </p>
          <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
            {PRICE_MODES.map((m) => {
              const sel = priceMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setPriceMode(m.id);
                    setPriceModeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${
                    sel ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{convertLabel(m.id)}</p>
                  </div>
                  {sel && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            모든 가격은 선택한 기준으로 자동 환산되어 표시됩니다.
          </p>
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
