import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Recycle, Search, Check, X, ChevronDown } from "lucide-react";
import { useApp } from "@/store/appStore";
import { CROPS, REGIONS_KR } from "@/data/catalog";
import { useToast } from "@/hooks/use-toast";
import MobileStatusBar from "@/components/MobileStatusBar";
import koreaMapImg from "@/assets/korea-map.png";
import chartImg from "@/assets/onboarding-chart.png";
import splashLogo from "@/assets/splash-logo.png";

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
  const [splashOut, setSplashOut] = useState(false);
  const [intro, setIntro] = useState(0);
  const [name, setName] = useState(profile.name === "농부" ? "" : profile.name);
  const [doProvince, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [unit, setUnit] = useState<"평" | "㎡">("㎡");
  const [sizeInput, setSizeInput] = useState("");
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropQuery, setCropQuery] = useState("");
  const introRef = useRef<HTMLDivElement>(null);

  // splash auto advance with crossfade overlay (1500ms hold → 400ms fade-out)
  useEffect(() => {
    if (step === "splash") {
      const t1 = setTimeout(() => {
        setSplashOut(true);
        setStep("intro");
      }, 1500);
      return () => clearTimeout(t1);
    }
  }, [step]);
  useEffect(() => {
    if (!splashOut) return;
    const t = setTimeout(() => setSplashOut(false), 400);
    return () => clearTimeout(t);
  }, [splashOut]);

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
  const SplashOverlay = ({ leaving }: { leaving?: boolean }) => (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[hsl(152_55%_42%)] to-[hsl(152_60%_32%)] ${leaving ? "splash-out pointer-events-none" : ""}`}
    >
      <img
        src={splashLogo}
        alt="앱 로고"
        className="splash-card w-[108px] h-[108px] mb-5 select-none"
        style={{ willChange: "transform, opacity" }}
        draggable={false}
      />
      <h1 className="splash-text text-white text-[22px] font-extrabold tracking-tight">
        농산물 시세 예측 서비스
      </h1>
    </div>
  );
  if (step === "splash") {
    return <SplashOverlay />;
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
      <div className={`absolute inset-0 bg-white flex flex-col ${splashOut ? "intro-enter" : ""}`}>
        <MobileStatusBar />
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
        {splashOut && <SplashOverlay leaving />}
      </div>
    );
  }

  // ===================== STEP HEADER =====================
  const Header = ({ onBack, title }: { onBack?: () => void; title?: string }) => (
    <div className="px-5 pt-3 pb-4">
      <div className="h-11 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 -ml-2 flex items-center justify-center shrink-0"
          aria-label="뒤로"
        >
          {onBack ? <ChevronLeft className="w-6 h-6 text-foreground" /> : <span className="w-6 h-6" />}
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-[hsl(220_13%_93%)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[hsl(152_55%_42%)] transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(0, progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

  // ===================== NAME =====================
  if (step === "name") {
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <MobileStatusBar />
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
        <MobileStatusBar />
        <Header onBack={() => setStep("name")} />
        <div className="flex-1 px-5 pt-2 overflow-y-auto">
          <h2 className="text-[22px] font-extrabold leading-snug text-foreground tracking-tight">
            농장이 위치한<br />지역을 선택해주세요.
          </h2>
          <p className="mt-2.5 text-[13px] text-muted-foreground">
            시세 조회와 판매처 추천의 기준 지역으로 사용됩니다.
          </p>

          <button
            onClick={() => {
              setProvince("충청남도");
              setCity("공주시");
              toast({ description: "현재 위치로 설정했어요" });
            }}
            className="mt-5 inline-flex items-center gap-1.5 h-9 pl-3 pr-3.5 rounded-full border border-border bg-white text-[12.5px] text-foreground font-medium active:scale-[0.98] transition"
          >
            <MapPin className="w-3.5 h-3.5 text-[hsl(152_55%_42%)]" /> 현재 위치로 설정
          </button>

          <div className="mt-7 space-y-5">
            <div>
              <p className="text-[12.5px] text-muted-foreground mb-2">시·도</p>
              <div className="relative">
                <select
                  value={doProvince}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    setCity("");
                  }}
                  className={`w-full h-12 pl-4 pr-10 rounded-xl border border-border bg-white text-[14px] appearance-none focus:outline-none focus:border-[hsl(152_55%_42%)] ${doProvince ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <option value="">시·도를 선택해주세요</option>
                  {Object.keys(REGIONS_KR).map((p) => <option key={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <p className="text-[12.5px] text-muted-foreground mb-2">시·군·구</p>
              <div className="relative">
                <select
                  value={city}
                  disabled={!doProvince}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full h-12 pl-4 pr-10 rounded-xl border border-border bg-white text-[14px] appearance-none focus:outline-none focus:border-[hsl(152_55%_42%)] disabled:opacity-60 ${city ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <option value="">{doProvince ? "시·군·구를 선택해주세요" : "시·도를 먼저 선택해주세요"}</option>
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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
        <MobileStatusBar />
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
                  onClick={() => {
                    if (u === unit) return;
                    const raw = Number(sizeInput.replace(/,/g, ""));
                    if (raw > 0) {
                      const converted = u === "㎡" ? raw * 3.306 : raw / 3.306;
                      setSizeInput(String(Math.round(converted)));
                    }
                    setUnit(u);
                  }}
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
        <MobileStatusBar />
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
            if ((window as any).__onbLock) return;
            (window as any).__onbLock = true;
            try {
              if ("vibrate" in navigator) navigator.vibrate?.(10);
            } catch {}
            setProfile({ myCrops: selectedCrops });
            setStep("done");
            setTimeout(() => { (window as any).__onbLock = false; }, 500);
          }}
        />
      </div>
    );
  }

  // ===================== DONE =====================
  const cropObjs = selectedCrops.map((id) => CROPS.find((c) => c.id === id)!).filter(Boolean);
  return (
    <div className="absolute inset-0 bg-white flex flex-col px-5 pt-12 pb-8 onb-done-enter">
      <style>{`
        @keyframes onbSlideIn { 0% { opacity: 0; transform: translateX(40px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes onbCheckPop { 0% { opacity: 0; transform: scale(0.4); } 60% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes onbDraw { to { stroke-dashoffset: 0; } }
        @keyframes onbFadeUp { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        .onb-done-enter { animation: onbSlideIn 360ms cubic-bezier(0.2,0.7,0.2,1) both; }
        .onb-check-pop { opacity: 0; animation: onbCheckPop 700ms cubic-bezier(0.2,0.9,0.3,1.3) both; }
        .onb-check-path { stroke-dasharray: 60; stroke-dashoffset: 60; animation: onbDraw 600ms cubic-bezier(0.4,0,0.2,1) 300ms forwards; }
        .onb-fadeup { opacity: 0; animation: onbFadeUp 400ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .onb-done-enter { animation: onbFadeUp 200ms ease-out both; }
          .onb-check-pop, .onb-fadeup { animation: onbFadeUp 200ms ease-out both !important; animation-delay: 0ms !important; }
          .onb-check-path { stroke-dashoffset: 0; animation: none; }
        }
      `}</style>
      <MobileStatusBar />
      <div className="flex-1 flex flex-col items-center text-center pt-4">
        <div className="w-20 h-20 rounded-full bg-[hsl(152_55%_42%)]/10 flex items-center justify-center onb-check-pop">
          <div className="w-14 h-14 rounded-full bg-[hsl(152_55%_42%)] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 16.5 L14 22 L24 11" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="onb-check-path" onAnimationStart={() => { try { (navigator as any).vibrate?.([10,30,10]); } catch {} }} />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-[20px] font-extrabold text-foreground onb-fadeup" style={{ animationDelay: "400ms" }}>
          {profile.name}님의 맞춤 설정이 완료됐어요!
        </h2>
        <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed onb-fadeup" style={{ animationDelay: "500ms" }}>
          {profile.region} · {cropObjs[0]?.name || "작물"}
          {cropObjs.length > 1 ? ` 외 ${cropObjs.length - 1}개 작물` : ""} 기준으로<br />
          시세와 예측을 준비했어요
        </p>

        <div className="mt-8 w-full rounded-2xl border border-border p-4 space-y-3 text-left onb-fadeup" style={{ animationDelay: "600ms" }}>
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
        className="w-full h-[52px] rounded-2xl bg-[hsl(152_55%_42%)] text-white text-[15px] font-bold onb-fadeup"
        style={{ animationDelay: "700ms" }}
      >
        시세 확인하러 가기
      </button>
      <p className="mt-3 text-center text-[12px] text-muted-foreground onb-fadeup" style={{ animationDelay: "750ms" }}>
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
      <div className="relative w-[300px] h-[320px] flex items-center justify-center">
        <img
          src={chartImg}
          alt="AI 시세 예측 차트"
          className="w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      </div>
    );
  }
  if (kind === "map") {
    return (
      <div className="relative w-[300px] h-[320px]">
        <img
          src={koreaMapImg}
          alt="대한민국 지도"
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
        {/* Pins on map */}
        <div className="absolute top-[40%] left-[48%]">
          <PinDot />
        </div>
        <div className="absolute top-[68%] left-[36%]">
          <PinDot />
        </div>
        {/* Floating price cards */}
        <PriceCard className="top-[14%] left-0" label="가락시장" price="3,240원" />
        <PriceCard className="top-[36%] right-0" label="대구북부시장" price="2,980원" />
        <PriceCard className="top-[64%] right-[-4px]" label="부산엄궁시장" price="3,100원" />
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

const MapMarker = ({ cx, cy }: { cx: number; cy: number }) => (
  <g transform={`translate(${cx} ${cy})`}>
    <ellipse cx="0" cy="2" rx="5" ry="1.5" fill="hsl(150 30% 40%)" opacity="0.18" />
    <path
      d="M 0 -14 C -5 -14 -8 -10 -8 -6 C -8 -1 0 6 0 6 C 0 6 8 -1 8 -6 C 8 -10 5 -14 0 -14 Z"
      fill="white"
      stroke="hsl(150 35% 55%)"
      strokeWidth="1"
    />
    <circle cx="0" cy="-7" r="2.6" fill="hsl(152 55% 42%)" />
  </g>
);

const PinDot = () => (
  <div className="-translate-x-1/2 -translate-y-full">
    <svg width="26" height="32" viewBox="0 0 22 28" fill="none">
      <path
        d="M11 0C5 0 0 4.5 0 10.5C0 18 11 28 11 28C11 28 22 18 22 10.5C22 4.5 17 0 11 0Z"
        fill="white"
        stroke="hsl(150 25% 80%)"
        strokeWidth="0.6"
      />
      <circle cx="11" cy="10.5" r="3.2" fill="hsl(150 38% 72%)" />
    </svg>
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
