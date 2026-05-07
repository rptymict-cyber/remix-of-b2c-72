import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, ChevronRight, Check } from "lucide-react";
import { useApp } from "@/store/appStore";
import { CROPS, REGIONS_KR } from "@/data/catalog";

type Step = "splash" | "intro" | "name" | "region" | "size" | "crops" | "done";

const intros = [
  { emoji: "📈", title: "AI가 농산물 가격을 예측합니다", desc: "향후 10일 가격 트렌드와 최적 출하 시점을 알려드립니다" },
  { emoji: "🏪", title: "전국 도매시장 실시간 시세", desc: "가락·대구북부·부산엄궁 등 전국 5대 시장의 실시간 경락가를 한눈에" },
  { emoji: "🗺️", title: "내 농장 기준 최적 판매처", desc: "물류비까지 계산한 실질 순이익 기준으로 가장 유리한 시장을 추천" },
];

const sizes = [
  { id: "소규모" as const, label: "1,000㎡ 미만", area: 800, desc: "소규모 농가" },
  { id: "중규모" as const, label: "1,000~5,000㎡", area: 3000, desc: "중규모 농가" },
  { id: "대규모" as const, label: "5,000㎡ 이상", area: 8000, desc: "대규모 농가" },
];

const Onboarding = () => {
  const nav = useNavigate();
  const { profile, setProfile, completeOnboarding, toggleMyCrop } = useApp();
  const [step, setStep] = useState<Step>("splash");
  const [intro, setIntro] = useState(0);
  const [name, setName] = useState(profile.name === "농부" ? "" : profile.name);
  const [doProvince, setProvince] = useState("충청남도");
  const [city, setCity] = useState("공주시");
  const [size, setSize] = useState<(typeof sizes)[number]["id"]>("중규모");

  useEffect(() => {
    if (step === "splash") {
      const t = setTimeout(() => setStep("intro"), 1500);
      return () => clearTimeout(t);
    }
  }, [step]);

  if (step === "splash") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-[hsl(160_50%_40%)] text-white">
        <Sprout className="w-16 h-16 mb-3" />
        <h1 className="text-3xl font-extrabold tracking-tight">FarmInsight</h1>
        <p className="text-sm text-white/80 mt-2">AI로 더 스마트한 농업을</p>
        <div className="mt-10 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-[loading_1.5s_ease-in-out]" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  if (step === "intro") {
    const it = intros[intro];
    return (
      <div className="min-h-screen bg-background flex flex-col px-6 pt-16 pb-8">
        <button onClick={() => setStep("name")} className="absolute top-6 right-6 text-xs text-muted-foreground">건너뛰기</button>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-7xl mb-8">{it.emoji}</div>
          <h2 className="text-xl font-bold text-foreground mb-3">{it.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
        </div>
        <div className="flex justify-center gap-1.5 mb-6">
          {intros.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === intro ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
          ))}
        </div>
        <button
          onClick={() => (intro < intros.length - 1 ? setIntro(intro + 1) : setStep("name"))}
          className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-bold"
        >
          {intro < intros.length - 1 ? "다음" : "시작하기"}
        </button>
      </div>
    );
  }

  if (step === "name") {
    return (
      <Frame title="안녕하세요, 농부님!" sub="성함을 알려주세요">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 김철수"
          className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-base"
        />
        <NextBtn disabled={!name.trim()} onClick={() => { setProfile({ name }); setStep("region"); }} />
      </Frame>
    );
  }

  if (step === "region") {
    const cities = REGIONS_KR[doProvince] || [];
    return (
      <Frame title="농장 위치를 알려주세요" sub="기상 예측과 시세 분석의 기준 지역이 됩니다">
        <div className="grid grid-cols-2 gap-2">
          <select value={doProvince} onChange={(e) => { setProvince(e.target.value); setCity((REGIONS_KR[e.target.value] || [""])[0]); }} className="px-3 py-3 rounded-xl border border-border bg-background text-sm">
            {Object.keys(REGIONS_KR).map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="px-3 py-3 rounded-xl border border-border bg-background text-sm">
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <NextBtn onClick={() => { setProfile({ region: `${doProvince.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "")} ${city}`.trim() }); setStep("size"); }} />
      </Frame>
    );
  }

  if (step === "size") {
    return (
      <Frame title="농장 규모가 어떻게 되세요?" sub="수확량 추정에 사용됩니다">
        <div className="space-y-2">
          {sizes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSize(s.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border ${size === s.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <p className="text-sm font-bold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
        <NextBtn onClick={() => { const s = sizes.find((x) => x.id === size)!; setProfile({ farmSize: size, farmAreaM2: s.area }); setStep("crops"); }} />
      </Frame>
    );
  }

  if (step === "crops") {
    return (
      <Frame title="현재 재배 작물을 선택해주세요" sub={`최대 3개까지 선택 (현재 ${profile.myCrops.length}/3)`}>
        <div className="grid grid-cols-2 gap-2">
          {CROPS.map((c) => {
            const sel = profile.myCrops.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleMyCrop(c.id)}
                className={`relative flex items-center gap-2 px-3 py-3 rounded-xl border ${sel ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                {sel && <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
        <NextBtn disabled={profile.myCrops.length === 0} label="완료 — 시작하기" onClick={() => setStep("done")} />
      </Frame>
    );
  }

  // done
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-xl font-bold text-foreground">{profile.name} 농부님, 준비됐습니다!</h2>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{profile.region} 기준으로<br />맞춤 시세와 예측을 제공해드릴게요</p>
      <button
        onClick={() => { completeOnboarding(); nav("/", { replace: true }); }}
        className="mt-10 w-full max-w-sm py-3.5 rounded-xl bg-primary text-white text-sm font-bold"
      >
        앱 시작하기
      </button>
    </div>
  );
};

const Frame = ({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background flex flex-col px-6 pt-16 pb-8">
    <h2 className="text-xl font-bold text-foreground">{title}</h2>
    <p className="text-sm text-muted-foreground mt-1.5 mb-8">{sub}</p>
    <div className="flex-1 space-y-3">{children}</div>
  </div>
);

const NextBtn = ({ onClick, disabled, label = "다음" }: { onClick: () => void; disabled?: boolean; label?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-40 mt-auto flex items-center justify-center gap-1"
  >
    {label} <ChevronRight className="w-4 h-4" />
  </button>
);

export default Onboarding;