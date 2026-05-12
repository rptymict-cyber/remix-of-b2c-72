import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Recycle, Search, Check, X } from "lucide-react";
import { useApp } from "@/store/appStore";
import { CROPS, REGIONS_KR } from "@/data/catalog";
import { useToast } from "@/hooks/use-toast";

type Step = "splash" | "intro" | "name" | "region" | "size" | "crops" | "done";

const intros = [
  {
    title: "오직 나를 위한\n맞춤형 시세 예측 AI",
    desc: "내 작물과 지역에 맞는 시세 흐름을 분석해\n언제 팔면 좋을지 AI가 알려드려요",
    visual: "chart",
  },
  {
    title: "전국 도매시장\n실시간 시세 한눈에",
    desc: "서울 가락시장부터 대구북부시장까지\n주요 도매시장의 경락가와 거래량을 확인하세요",
    visual: "map",
  },
  {
    title: "물류비까지 계산한\n진짜 순이익 판매처 추천",
    desc: "단가 높다고 유리한 게 아닙니다.\n물류비를 포함한 실질 순이익 기준으로\n최적 판매처를 추천해드려요",
    visual: "rank",
  },
  {
    title: "다음 시즌 유망 작물도\nAI가 추천",
    desc: "장기 가격 전망과 지역 기후 적합도를\n분석해 수익성 높은 작물을 미리 알려드려요",
    visual: "crop",
  },
] as const;

const AI_CROPS = new Set(["pepper", "apple", "cabbage", "onion", "radish"]);
const READY_CROPS = new Set([
  "pepper","apple","cabbage","onion","radish","tomato","strawberry","potato","garlic","corn",
  "pear","watermelon","peach","lettuce","sweet_potato","green_onion","mandarin","rice","soybean",
]);

const sizePresets = [
  { label: "1,000㎡ 미만", value: 800 },
  { label: "1,000~3,000㎡", value: 2000 },
  { label: "3,000~5,000㎡", value: 4000 },
  { label: "5,000㎡ 이상", value: 6000 },
];

const Onboarding = () => {
  const nav = useNavigate();
  const { toast } = useToast();
  const { profile, setProfile, completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>("splash");
  const [intro, setIntro] = useState(0);
  const [name, setName] = useState(profile.name === "농부" ? "" : profile.name);
  const [doProvince, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [unit, setUnit] = useState<"평" | "㎡">("㎡");
  const [sizeInput, setSizeInput] = useState("");
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropQuery, setCropQuery] = useState("");
  const introRef = useRef<HTMLDivElement>(null);

  // splash auto advance
  useEffect(() => {
    if (step === "splash") {
      const t = setTimeout(() => setStep("intro"), 1500);
      return () => clearTimeout(t);
    }
  }, [step]);

  // size in m2
  const sizeM2 = useMemo(() => {
    const n = Number(sizeInput.replace(/,/g, ""));
    if (!n) return 0;
    return unit === "평" ? Math.round(n * 3.3058) : n;
  }, [sizeInput, unit]);

  const expectedYieldKg = Math.round(sizeM2 * 0.3); // 고추 기준 대략 환산

  const stepIndex = (["name", "region", "size", "crops"] as const).indexOf(step as any);
  const progress = stepIndex >= 0 ? (stepIndex + 1) / 4 : 0;

  // ===================== SPLASH =====================
  if (step === "splash") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[hsl(152_55%_42%)] to-[hsl(152_60%_32%)] animate-in fade-in duration-300">
        <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-5">
          <Recycle className="w-12 h-12 text-[hsl(152_55%_42%)]" strokeWidth={2.4} />
        </div>
        <h1 className="text-white text-[22px] font-extrabold tracking-tight">농산물 시세 예측 서비스</h1>
      </div>
    );
  }

  // ===================== INTRO =====================
  if (step === "intro") {
    const last = intro === intros.length - 1;
    const onTouchStart = (e: React.TouchEvent) => {
      (introRef as any).startX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: React.TouchEvent) => {
      const startX = (introRef as any).startX;
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0 && intro < intros.length - 1) setIntro(intro + 1);
      if (dx > 0 && intro > 0) setIntro(intro - 1);
    };
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <div className="h-12 flex items-center justify-between px-3">
          <button
            onClick={() => intro > 0 && setIntro(intro - 1)}
            className="w-10 h-10 flex items-center justify-center"
            aria-label="뒤로"
          >
            {intro > 0 ? <ChevronLeft className="w-6 h-6 text-foreground" /> : <span />}
          </button>
          {!last ? (
            <button onClick={() => setStep("name")} className="px-2 text-[13px] text-muted-foreground">
              건너뛰기
            </button>
          ) : (
            <span className="w-10" />
          )}
        </div>
        <div
          ref={introRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="flex-1 overflow-hidden"
        >
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${intro * 100}%)` }}
          >
            {intros.map((it, i) => (
              <div
                key={i}
                className="shrink-0 w-full h-full flex flex-col items-center justify-center px-8 text-center"
              >
                <IntroVisual kind={it.visual} />
                <h2 className="mt-10 text-[22px] font-extrabold leading-snug text-foreground whitespace-pre-line">
                  {it.title}
                </h2>
                <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground whitespace-pre-line">
                  {it.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mb-6">
          {intros.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === intro ? "w-5 bg-[hsl(152_55%_42%)]" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
        <div className="px-5 pb-8">
          <button
            onClick={() => (last ? setStep("name") : setIntro(intro + 1))}
            className="w-full h-[52px] rounded-2xl bg-[hsl(152_55%_42%)] text-white text-[15px] font-bold active:scale-[0.99] transition"
          >
            {last ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
    );
  }

  // ===================== STEP HEADER =====================
  const Header = ({ onBack, title }: { onBack?: () => void; title?: string }) => (
    <div className="px-5 pt-3 pb-4">
      <div className="h-12 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 -ml-2 flex items-center justify-center"
          aria-label="뒤로"
        >
          {onBack ? <ChevronLeft className="w-6 h-6 text-foreground" /> : <span />}
        </button>
        <p className="text-[15px] font-semibold text-foreground">{title || "프로필 설정"}</p>
        <span className="w-10" />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 rounded-full ${i < Math.ceil(progress * 4) ? "bg-[hsl(152_55%_42%)]" : "bg-border"}`}
          />
        ))}
      </div>
    </div>
  );

  // ===================== NAME =====================
  if (step === "name") {
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <Header onBack={() => setStep("intro")} />
        <div className="flex-1 px-5 pt-2 overflow-y-auto">
          <h2 className="text-[22px] font-extrabold leading-snug text-foreground">
            환영합니다!<br />이름을 입력해주세요.
          </h2>
          <div className="mt-8 relative">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="w-full h-14 px-4 pr-11 rounded-2xl border border-border bg-background text-[15px] focus:outline-none focus:border-[hsl(152_55%_42%)]"
            />
            {name && (
              <button
                onClick={() => setName("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <CTA
          disabled={!name.trim()}
          onClick={() => {
            setProfile({ name: name.trim() });
            // initialize region from existing profile if any
            const parts = profile.region?.split(" ") || [];
            if (parts.length === 2 && !doProvince) {
              const guessProv = Object.keys(REGIONS_KR).find((p) =>
                p.startsWith(parts[0]) || parts[0].includes(p.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "")),
              );
              if (guessProv) {
                setProvince(guessProv);
                if ((REGIONS_KR[guessProv] || []).includes(parts[1])) setCity(parts[1]);
              }
            }
            setStep("region");
          }}
        />
      </div>
    );
  }

  // ===================== REGION =====================
  if (step === "region") {
    const cities = doProvince ? REGIONS_KR[doProvince] || [] : [];
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <Header onBack={() => setStep("name")} />
        <div className="flex-1 px-5 pt-2 overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-extrabold leading-snug text-foreground">
                농장이 위치한 지역을<br />선택해주세요.
              </h2>
              <p className="mt-2 text-[13px] text-muted-foreground">
                시세 조회와 판매처 추천의 기준 지역으로 사용됩니다.
              </p>
            </div>
            <button
              onClick={() => {
                setProvince("충청남도");
                setCity("공주시");
                toast({ description: "현재 위치로 설정했어요" });
              }}
              className="shrink-0 mt-1 inline-flex items-center gap-1 text-[12px] text-[hsl(152_55%_42%)] font-medium"
            >
              <MapPin className="w-3.5 h-3.5" /> 현재 위치로 설정
            </button>
          </div>

          <div className="mt-7 space-y-4">
            <div>
              <p className="text-[12px] text-muted-foreground mb-1.5">시·도 선택</p>
              <select
                value={doProvince}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setCity("");
                }}
                className={`w-full h-12 px-4 rounded-xl border bg-background text-[14px] appearance-none ${doProvince ? "border-[hsl(152_55%_42%)] text-foreground" : "border-border text-muted-foreground"}`}
              >
                <option value="">시·도를 선택해주세요</option>
                {Object.keys(REGIONS_KR).map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground mb-1.5">시·군·구 선택</p>
              <select
                value={city}
                disabled={!doProvince}
                onChange={(e) => setCity(e.target.value)}
                className={`w-full h-12 px-4 rounded-xl border bg-background text-[14px] appearance-none disabled:opacity-50 ${city ? "border-[hsl(152_55%_42%)] text-foreground" : "border-border text-muted-foreground"}`}
              >
                <option value="">{doProvince ? "시·군·구를 선택해주세요" : "시·도를 먼저 선택해주세요"}</option>
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <p className="text-[12px] text-muted-foreground pt-1">
              읍·면·동 단위까지는 입력하지 않아도 됩니다.
            </p>
          </div>
        </div>
        <CTA
          disabled={!doProvince || !city}
          onClick={() => {
            const short = doProvince.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "");
            setProfile({ region: `${short} ${city}`.trim() });
            setStep("size");
          }}
        />
      </div>
    );
  }

  // ===================== SIZE =====================
  if (step === "size") {
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <Header onBack={() => setStep("region")} />
        <div className="flex-1 px-5 pt-2 overflow-y-auto">
          <h2 className="text-[20px] font-extrabold leading-snug text-foreground">
            농장 규모를 입력해주세요.
          </h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            예상 수확량과 출하량 계산의 기준이 됩니다.
          </p>

          <div className="mt-7 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                inputMode="numeric"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value.replace(/[^0-9,]/g, ""))}
                placeholder="농장 규모"
                className="w-full h-12 px-4 pr-10 rounded-xl border border-border bg-background text-[14px] focus:outline-none focus:border-[hsl(152_55%_42%)]"
              />
              {sizeInput && (
                <button
                  onClick={() => setSizeInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex rounded-xl border border-border overflow-hidden h-12">
              {(["평", "㎡"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`w-12 text-[13px] font-medium ${unit === u ? "bg-[hsl(152_55%_42%)] text-white" : "bg-background text-muted-foreground"}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {sizeM2 > 0 && (
            <p className="mt-3 text-[13px] text-[hsl(152_55%_42%)] font-medium">
              약 {sizeM2.toLocaleString()}㎡ · 고추 기준 예상 수확량 약 {expectedYieldKg.toLocaleString()}kg
            </p>
          )}

          <p className="mt-7 text-[12px] text-muted-foreground mb-2">빠른 선택</p>
          <div className="grid grid-cols-2 gap-2">
            {sizePresets.map((p) => {
              const active = unit === "㎡" && Number(sizeInput.replace(/,/g, "")) === p.value;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    setUnit("㎡");
                    setSizeInput(String(p.value));
                  }}
                  className={`h-12 rounded-xl border text-[13px] font-medium ${active ? "border-[hsl(152_55%_42%)] bg-[hsl(152_55%_42%)]/8 text-[hsl(152_55%_42%)]" : "border-border bg-background text-foreground"}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-[12px] text-muted-foreground">
            ⓘ 입력하신 규모에 따라 예상 수확량이 계산됩니다.
          </p>
        </div>
        <CTA
          disabled={sizeM2 <= 0}
          onClick={() => {
            const farmSize: "소규모" | "중규모" | "대규모" =
              sizeM2 < 1000 ? "소규모" : sizeM2 < 5000 ? "중규모" : "대규모";
            setProfile({ farmAreaM2: sizeM2, farmSize });
            setStep("crops");
          }}
        />
      </div>
    );
  }

  // ===================== CROPS =====================
  if (step === "crops") {
    const filtered = CROPS.filter((c) => c.name.includes(cropQuery.trim()));
    const aiCrops = filtered.filter((c) => AI_CROPS.has(c.id));
    const normalCrops = filtered.filter((c) => !AI_CROPS.has(c.id));

    const toggle = (id: string) => {
      setSelectedCrops((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 3) {
          toast({ description: "최대 3개까지 선택 가능합니다." });
          return prev;
        }
        return [...prev, id];
      });
    };

    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <Header onBack={() => setStep("size")} />
        <div className="px-5 pt-2">
          <h2 className="text-[20px] font-extrabold leading-snug text-foreground">
            현재 재배 중인 작물을<br />모두 선택해주세요.
          </h2>
          <p className="mt-2 text-[13px] text-muted-foreground">최대 3개까지 선택 가능합니다.</p>

          <div className="mt-5 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={cropQuery}
              onChange={(e) => setCropQuery(e.target.value)}
              placeholder="작물 이름 검색"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:border-[hsl(152_55%_42%)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2">
          {aiCrops.length > 0 && (
            <div className="mb-5">
              <p className="text-[12px] font-semibold text-foreground mb-2">AI 예측 지원 작물</p>
              <CropGrid crops={aiCrops} selected={selectedCrops} onToggle={toggle} aiSet={AI_CROPS} readySet={READY_CROPS} />
            </div>
          )}
          {normalCrops.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-2">일반 작물</p>
              <CropGrid crops={normalCrops} selected={selectedCrops} onToggle={toggle} aiSet={AI_CROPS} readySet={READY_CROPS} />
            </div>
          )}
        </div>

        {selectedCrops.length > 0 && (
          <div className="px-5 py-2 border-t border-border overflow-x-auto">
            <div className="flex gap-2 w-max">
              {selectedCrops.map((id) => {
                const c = CROPS.find((x) => x.id === id)!;
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    className="inline-flex items-center gap-1 h-8 pl-2 pr-1.5 rounded-full bg-[hsl(152_55%_42%)]/10 text-[12px] text-[hsl(152_55%_42%)] font-medium"
                  >
                    <span>{c.emoji}</span>{c.name}
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <CTA
          label="완료"
          disabled={selectedCrops.length === 0}
          onClick={() => {
            setProfile({ myCrops: selectedCrops });
            setStep("done");
          }}
        />
      </div>
    );
  }

  // ===================== DONE =====================
  const cropObjs = selectedCrops.map((id) => CROPS.find((c) => c.id === id)!).filter(Boolean);
  return (
    <div className="absolute inset-0 bg-white flex flex-col px-5 pt-16 pb-8 animate-in fade-in duration-300">
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[hsl(152_55%_42%)]/10 flex items-center justify-center animate-in zoom-in duration-300">
          <div className="w-14 h-14 rounded-full bg-[hsl(152_55%_42%)] flex items-center justify-center">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        </div>
        <h2 className="mt-6 text-[20px] font-extrabold text-foreground">
          {profile.name}님의 맞춤 설정이 완료됐어요!
        </h2>
        <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
          {profile.region} · {cropObjs[0]?.name || "작물"}
          {cropObjs.length > 1 ? ` 외 ${cropObjs.length - 1}개 작물` : ""} 기준으로<br />
          시세와 예측을 준비했어요
        </p>

        <div className="mt-8 w-full rounded-2xl border border-border p-4 space-y-3 text-left">
          <Row icon="📍" text={profile.region} />
          <Row icon="📐" text={`${profile.farmAreaM2.toLocaleString()}㎡`} />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px]">🌾</span>
            {cropObjs.map((c) => (
              <span key={c.id} className="text-[13px] text-foreground">
                {c.emoji} {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          completeOnboarding();
          nav("/", { replace: true });
        }}
        className="w-full h-[52px] rounded-2xl bg-[hsl(152_55%_42%)] text-white text-[15px] font-bold"
      >
        시세 확인하러 가기
      </button>
      <p className="mt-3 text-center text-[12px] text-muted-foreground">
        설정은 마이페이지에서 언제든지 변경할 수 있어요
      </p>
    </div>
  );
};

const Row = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex items-center gap-2 text-[13px] text-foreground">
    <span>{icon}</span>
    <span>{text}</span>
  </div>
);

const CTA = ({
  onClick,
  disabled,
  label = "다음",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) => (
  <div className="px-5 pt-3 pb-6 bg-white border-t border-transparent">
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[52px] rounded-2xl bg-[hsl(152_55%_42%)] text-white text-[15px] font-bold disabled:bg-muted disabled:text-muted-foreground transition active:scale-[0.99]"
    >
      {label}
    </button>
  </div>
);

const CropGrid = ({
  crops,
  selected,
  onToggle,
  aiSet,
  readySet,
}: {
  crops: typeof CROPS;
  selected: string[];
  onToggle: (id: string) => void;
  aiSet: Set<string>;
  readySet: Set<string>;
}) => (
  <div className="grid grid-cols-3 gap-2">
    {crops.map((c) => {
      const sel = selected.includes(c.id);
      const isAI = aiSet.has(c.id);
      const ready = readySet.has(c.id);
      return (
        <button
          key={c.id}
          onClick={() => ready && onToggle(c.id)}
          disabled={!ready}
          className={`relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition ${
            sel
              ? "border-[hsl(152_55%_42%)] bg-[hsl(152_55%_42%)]/8"
              : "border-border bg-background"
          } ${!ready ? "opacity-50" : ""}`}
        >
          <span className="text-2xl">{c.emoji}</span>
          <span className="text-[12px] font-medium text-foreground">{c.name}</span>
          {isAI && (
            <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(152_55%_42%)] text-white font-bold">
              AI예측
            </span>
          )}
          {!ready && (
            <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              준비중
            </span>
          )}
          {sel && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[hsl(152_55%_42%)] flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const IntroVisual = ({ kind }: { kind: string }) => {
  if (kind === "chart") {
    return (
      <div className="relative w-[280px] h-[320px] flex items-start justify-center pt-2">
        {/* Soft green blurred backdrop */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[230px] h-[260px] rounded-[40px] bg-[hsl(152_55%_42%)]/12 blur-2xl" />

        {/* Phone mockup (iPhone-style) */}
        <div className="relative w-[190px] h-[280px] rounded-[34px] bg-white shadow-[0_24px_48px_rgba(0,0,0,0.18)] ring-[3px] ring-foreground/85 ring-offset-0 overflow-hidden">
          {/* Dynamic island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[58px] h-[14px] bg-foreground rounded-full z-10" />
          {/* App content */}
          <div className="absolute inset-0 pt-7 px-3 flex flex-col">
            {/* Header bar */}
            <div className="flex items-center justify-between px-1.5 mt-1 mb-1">
              <span className="text-[14px] leading-none text-foreground/80">‹</span>
              <span className="text-[10px] text-muted-foreground">❤</span>
            </div>
            {/* Chart area */}
            <div className="relative flex-1">
              <svg viewBox="0 0 160 140" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {/* horizontal grid */}
                <line x1="20" y1="30" x2="155" y2="30" stroke="hsl(0 0% 90%)" strokeDasharray="2 3" strokeWidth="0.6" />
                <line x1="20" y1="65" x2="155" y2="65" stroke="hsl(0 0% 90%)" strokeDasharray="2 3" strokeWidth="0.6" />
                <line x1="20" y1="100" x2="155" y2="100" stroke="hsl(0 0% 90%)" strokeDasharray="2 3" strokeWidth="0.6" />
                {/* y-axis labels */}
                <text x="4" y="32" fontSize="7" fill="hsl(0 0% 60%)">99</text>
                <text x="4" y="67" fontSize="7" fill="hsl(0 0% 60%)">66</text>
                <text x="4" y="102" fontSize="7" fill="hsl(0 0% 60%)">33</text>
                {/* jagged line */}
                <polyline
                  fill="none"
                  stroke="hsl(152 55% 42%)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="22,108 32,96 40,102 50,86 58,94 68,72 78,80 86,64 96,70 104,50 114,58 124,40 134,46 144,28 152,34"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Floating AI card — overlapping bottom of phone */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[230px] bg-white rounded-2xl shadow-[0_14px_32px_rgba(0,0,0,0.14)] px-4 py-3 text-left">
          <p className="text-[13px] font-extrabold text-[hsl(152_55%_42%)] mb-1.5">AI 예측</p>
          <p className="text-[13px] font-bold text-foreground leading-tight">5월 12일(화) 출하 추천</p>
          <p className="text-[12px] text-muted-foreground mt-1">예상 수익 <span className="text-[hsl(152_55%_42%)] font-extrabold">+8.1%</span></p>
        </div>
      </div>
    );
  }
  if (kind === "map") {
    return (
      <div className="relative w-[300px] h-[300px]">
        {/* Watercolor Korea peninsula */}
        <svg viewBox="0 0 200 220" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="koreaFill" cx="55%" cy="40%" r="70%">
              <stop offset="0%" stopColor="hsl(150 42% 80%)" stopOpacity="0.85" />
              <stop offset="65%" stopColor="hsl(150 38% 76%)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(150 35% 74%)" stopOpacity="0.45" />
            </radialGradient>
          </defs>
          {/* Mainland — rough Korean peninsula silhouette */}
          <path
            fill="url(#koreaFill)"
            d="M105,8 C95,6 85,10 82,20 C70,18 60,24 62,38 C54,42 48,52 56,62 C44,66 40,80 52,88 C42,96 44,110 56,114 C46,124 50,138 62,142 C52,154 58,170 72,172 C66,184 72,196 86,198 C82,210 92,222 108,218 C124,214 132,202 130,190 C144,188 152,176 148,164 C160,160 168,148 162,136 C172,128 172,114 162,108 C172,100 172,86 160,82 C168,72 166,58 154,54 C158,42 152,30 138,28 C136,16 122,8 105,8 Z"
          />
          {/* Jeju island */}
          <ellipse cx="92" cy="208" rx="10" ry="5" fill="url(#koreaFill)" />
        </svg>

        {/* Pins on map */}
        <MapPinMarker className="top-[42%] left-[42%]" />
        <MapPinMarker className="top-[74%] left-[40%]" />

        {/* Floating cards */}
        <PriceCard className="top-[8%] left-0" label="가락시장" price="3,240원" />
        <PriceCard className="top-[40%] right-0" label="대구북부시장" price="2,980원" />
        <PriceCard className="top-[72%] right-[-4px]" label="부산엄궁시장" price="3,100원" />
      </div>
    );
  }
  if (kind === "rank") {
    return (
      <div className="w-[290px] rounded-3xl bg-[hsl(0_0%_96%)] shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-4">
        <p className="text-[14px] font-extrabold text-foreground mb-3 px-1">추천 판매처 TOP 3</p>
        <div className="rounded-2xl bg-white px-4 py-1 divide-y divide-border/60">
          {[
            { name: "대구북부시장", profit: "1,245,000원", badge: true },
            { name: "부산엄궁시장", profit: "1,128,000원" },
            { name: "광주서부시장", profit: "1,087,000원" },
          ].map((m, i) => (
            <div key={m.name} className="flex items-center gap-3 py-3.5">
              <span className="w-7 h-7 rounded-md text-[13px] font-extrabold flex items-center justify-center shrink-0 bg-[hsl(152_55%_42%)] text-white">
                {i + 1}
              </span>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-bold text-foreground leading-tight">{m.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">예상 순이익 {m.profit}</p>
              </div>
              {m.badge && (
                <span className="w-7 h-7 rounded-full bg-[hsl(42_90%_70%)]/40 flex items-center justify-center text-[14px] leading-none">🏆</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  // crop
  return (
    <div className="relative w-[290px]">
      <div className="relative rounded-3xl bg-[hsl(150_25%_94%)] shadow-[0_10px_30px_rgba(0,0,0,0.08)] px-5 pt-5 pb-6 overflow-hidden">
        <span className="block text-[12px] text-[hsl(152_55%_42%)] font-extrabold mb-4">AI 추천 작물</span>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[40px] leading-none">🧅</span>
          <span className="text-[26px] font-extrabold text-foreground">양파</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MetricChip label="수익성" value="높음" tone="green" />
          <MetricChip label="리스크" value="보통" tone="yellow" />
          <MetricChip label="지역 적합도" value="높음" tone="green" />
        </div>
        <span className="absolute bottom-2 right-3 text-[28px] rotate-[20deg] select-none">🌿</span>
      </div>
    </div>
  );
};

const PriceCard = ({ className, label, price }: { className?: string; label: string; price: string }) => (
  <div className={`absolute bg-white rounded-2xl shadow-[0_8px_22px_rgba(0,0,0,0.10)] px-3.5 py-2 text-left ${className}`}>
    <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
    <p className="text-[15px] font-extrabold text-foreground mt-1 leading-tight tracking-tight">{price}</p>
  </div>
);

const MapPinMarker = ({ className }: { className?: string }) => (
  <div className={`absolute -translate-x-1/2 -translate-y-full ${className}`}>
    <svg width="26" height="32" viewBox="0 0 22 28" fill="none">
      <path
        d="M11 0C5 0 0 4.5 0 10.5C0 18 11 28 11 28C11 28 22 18 22 10.5C22 4.5 17 0 11 0Z"
        fill="white"
        stroke="hsl(150 25% 80%)"
        strokeWidth="0.6"
      />
      <circle cx="11" cy="10.5" r="3.2" fill="hsl(150 35% 72%)" />
    </svg>
  </div>
);

const MetricChip = ({ label, value, tone }: { label: string; value: string; tone: "green" | "yellow" }) => (
  <div className="rounded-xl bg-white py-2.5 text-center">
    <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    <p className={`text-[12px] font-bold mt-1 ${tone === "green" ? "text-[hsl(152_55%_42%)]" : "text-[hsl(28_85%_55%)]"}`}>{value}</p>
  </div>
);

export default Onboarding;
