import { useMemo, useState } from "react";
import { ChevronLeft, Search, Check, MapPin, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/store/appStore";
import { CROPS, MARKETS, findCrop, findMarket } from "@/data/catalog";
import MobileStatusBar from "@/components/MobileStatusBar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

type RegType = "growing" | "interest";
type Timing = "this_week" | "next_week" | "custom";
type Pkg = "box15" | "box20" | "net" | "sack" | "tbd";
type UnitSel = "kg" | "box" | "ton";

const PRIORITY_IDS = ["apple", "cabbage", "onion", "radish"];
const EXTRA_IDS = ["pepper", "strawberry", "tomato"];
const NO_FORECAST = new Set(["strawberry", "tomato"]);
const MAX_MY = 3;

const AddCrop = () => {
  const nav = useNavigate();
  const { profile, marketId, notif, setMarket, setNotif, toggleMyCrop } = useApp();

  const [q, setQ] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [regType, setRegType] = useState<RegType>("growing");
  const [variety, setVariety] = useState<string>("전체 품종");
  const [varOpen, setVarOpen] = useState(false);
  const [marketSel, setMarketSel] = useState<string>(marketId || "garak");
  const [marketOpen, setMarketOpen] = useState(false);
  const [qty, setQty] = useState<string>("");
  const [unit, setUnit] = useState<UnitSel>("kg");
  const [timing, setTiming] = useState<Timing>("this_week");
  const [pkg, setPkg] = useState<Pkg>("box15");
  const [aPrice, setAPrice] = useState(notif.priceAlert);
  const [aForecast, setAForecast] = useState(notif.forecastUpdate);
  const [aShip, setAShip] = useState(false);

  const priority = CROPS.filter((c) => PRIORITY_IDS.includes(c.id));
  const extras = CROPS.filter((c) => EXTRA_IDS.includes(c.id));
  const filteredExtras = q ? CROPS.filter((c) => c.name.includes(q)) : extras;
  const filteredPriority = q ? priority.filter((c) => c.name.includes(q)) : priority;

  const crop = selectedCrop ? findCrop(selectedCrop) : null;
  const market = findMarket(marketSel);

  const overLimit = profile.myCrops.length >= MAX_MY && !profile.myCrops.includes(selectedCrop);
  const canSubmit = !!selectedCrop && !overLimit;

  const submit = () => {
    if (!canSubmit || !crop) return;
    if (!profile.myCrops.includes(crop.id)) toggleMyCrop(crop.id);
    setMarket(marketSel);
    setNotif({ priceAlert: aPrice, forecastUpdate: aForecast });
    toast.success(`${crop.name}이(가) 내 작물에 추가되었습니다.`);
    nav("/crop");
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <MobileStatusBar />
        <div className="relative flex items-center justify-center h-14 px-4">
          <button onClick={() => nav(-1)} className="absolute left-4 text-foreground" aria-label="뒤로">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-foreground">작물 추가</h1>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* 안내 */}
        <section className="bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3.5">
          <p className="text-[13px] font-semibold text-foreground leading-snug">
            재배 중이거나 관심 있는 작물을 등록하면<br />시세·예측·출하 추천을 맞춤으로 보여드려요.
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            입력한 정보는 홈·시세·예측·판매처 화면의 기본 조건으로 사용됩니다.
          </p>
        </section>

        {overLimit && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3 text-[12px] text-destructive">
            작물은 최대 {MAX_MY}개까지 등록할 수 있습니다. 기존 작물을 삭제한 뒤 다시 추가해 주세요.
          </div>
        )}

        {/* 1. 작물 선택 */}
        <Section title="작물 선택" desc="시세와 예측을 확인할 작물을 선택해 주세요.">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="작물명 검색"
              className="w-full pl-9 pr-3 py-3 text-sm rounded-xl border border-border bg-background"
            />
          </div>
          {filteredPriority.length === 0 && filteredExtras.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-foreground font-medium">검색 결과가 없습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">다른 작물명으로 다시 검색해 주세요.</p>
            </div>
          ) : (
            <>
              {filteredPriority.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {filteredPriority.map((c) => (
                    <CropCard key={c.id} crop={c} selected={selectedCrop === c.id} onClick={() => setSelectedCrop(c.id)} />
                  ))}
                </div>
              )}
              {filteredExtras.length > 0 && (
                <>
                  <p className="text-[11px] text-muted-foreground mt-3 mb-2 px-1">기타 작물</p>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredExtras.map((c) => (
                      <CropCard key={c.id} crop={c} selected={selectedCrop === c.id} onClick={() => setSelectedCrop(c.id)} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {crop && NO_FORECAST.has(crop.id) && (
            <div className="mt-3 bg-warning/10 border border-warning/20 rounded-xl px-3 py-2.5">
              <p className="text-[12px] font-semibold text-foreground">현재 이 작물은 시세 조회만 지원됩니다.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">AI 예측은 추후 제공될 예정입니다.</p>
            </div>
          )}
        </Section>

        {/* 2. 등록 유형 */}
        <Section title="등록 유형" desc="이 작물을 어떤 목적으로 등록할지 선택해 주세요.">
          <div className="space-y-2">
            <TypeOption
              active={regType === "growing"}
              onClick={() => setRegType("growing")}
              title="재배 중인 작물"
              desc="출하 시점 추천과 판매처 비교에 활용됩니다."
            />
            <TypeOption
              active={regType === "interest"}
              onClick={() => setRegType("interest")}
              title="관심 작물"
              desc="시세 추적과 가격 변동 알림에 활용됩니다."
            />
          </div>
        </Section>

        {/* 3. 품종 */}
        <Section title="품종 / 품목" desc="품종을 선택하면 더 정확한 시세와 예측을 확인할 수 있습니다.">
          <button
            onClick={() => crop && setVarOpen(true)}
            disabled={!crop}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-border bg-card disabled:opacity-50"
          >
            <span className="text-sm text-foreground">{crop ? variety : "작물을 먼저 선택해 주세요"}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </Section>

        {/* 4. 재배 지역 */}
        <Section title="재배 지역" desc="이 지역의 기상 정보가 AI 예측에 반영됩니다.">
          <div className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{profile.region}</p>
                <p className="text-[11px] text-muted-foreground">향후 10일 기상이 이 지역 기준으로 반영됩니다.</p>
              </div>
            </div>
            <button onClick={() => nav("/mypage")} className="text-xs text-primary font-medium">지역 변경</button>
          </div>
        </Section>

        {/* 5. 예상 출하 정보 */}
        <Section title="예상 출하 정보" desc="입력하면 예상 수익과 추천 출하일을 더 정확히 계산할 수 있어요. (선택)">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-muted-foreground">예상 출하량</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="500"
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm"
                />
                <div className="flex rounded-xl border border-border overflow-hidden">
                  {(["kg", "box", "ton"] as UnitSel[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={`px-3 text-xs font-medium ${unit === u ? "bg-primary text-white" : "bg-card text-muted-foreground"}`}
                    >
                      {u === "kg" ? "kg" : u === "box" ? "상자" : "톤"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">출하 예정 시기</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {([
                  ["this_week", "이번 주"],
                  ["next_week", "다음 주"],
                  ["custom", "직접 선택"],
                ] as [Timing, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTiming(id)}
                    className={`py-2.5 text-xs font-medium rounded-xl border ${timing === id ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">포장 단위</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {([
                  ["box15", "15kg 상자"],
                  ["box20", "20kg 상자"],
                  ["net", "망"],
                  ["sack", "포대"],
                  ["tbd", "미정"],
                ] as [Pkg, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setPkg(id)}
                    className={`py-2.5 text-xs font-medium rounded-xl border ${pkg === id ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 6. 기준 시장 */}
        <Section title="기준 시장" desc="기본으로 확인할 도매시장을 선택해 주세요.">
          <button
            onClick={() => setMarketOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-border bg-card"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">{market.name}</p>
              <p className="text-[11px] text-muted-foreground">{market.region}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <p className="text-[11px] text-muted-foreground mt-2 px-1">
            선택한 시장은 홈·시세·예측 화면의 기본 기준으로 사용됩니다.
          </p>
        </Section>

        {/* 7. 알림 설정 */}
        <Section title="알림 설정" desc="가격 변동과 예측 업데이트를 놓치지 않도록 알려드려요.">
          <div className="space-y-2">
            <Toggle title="가격 급등락 알림" desc="전일 대비 ±10% 이상 변동 시 알림" on={aPrice} onChange={setAPrice} />
            <Toggle title="예측 업데이트 알림" desc="AI 예측 결과가 갱신되면 알림" on={aForecast} onChange={setAForecast} />
            <Toggle title="출하 추천일 알림" desc="추천 출하일 3일 전 알림" on={aShip} onChange={setAShip} />
          </div>
        </Section>
      </main>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border px-4 py-3 safe-bottom">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl bg-primary text-white text-[15px] font-bold disabled:opacity-40"
        >
          작물 추가하기
        </button>
      </div>

      {/* 품종 시트 */}
      <Drawer open={varOpen} onOpenChange={setVarOpen}>
        <DrawerContent className="px-4 pb-6">
          <h3 className="text-base font-bold text-foreground text-center mb-3 pt-2">
            품종 선택{crop ? ` · ${crop.name}` : ""}
          </h3>
          <div className="space-y-1.5">
            {(crop ? ["전체 품종", ...crop.varieties] : []).map((v) => {
              const sel = v === variety;
              return (
                <button
                  key={v}
                  onClick={() => { setVariety(v); setVarOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${sel ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <span className="text-sm font-medium text-foreground">{v}</span>
                  {sel && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
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
                  onClick={() => { setMarketSel(m.id); setMarketOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${sel ? "border-primary bg-primary/5" : "border-border bg-card"}`}
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

const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
    {desc && <p className="text-[11px] text-muted-foreground mt-0.5 mb-2.5 leading-relaxed">{desc}</p>}
    {children}
  </section>
);

const CropCard = ({ crop, selected, onClick }: { crop: { id: string; name: string; emoji: string }; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2.5 px-4 py-3.5 rounded-xl border ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}
  >
    <span className="text-2xl">{crop.emoji}</span>
    <span className="text-sm font-semibold text-foreground">{crop.name}</span>
    {selected && <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />}
  </button>
);

const TypeOption = ({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3.5 rounded-xl border ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <span className={`w-4 h-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-border"}`} />
    </div>
    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
  </button>
);

const Toggle = ({ title, desc, on, onChange }: { title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-border bg-card">
    <div className="flex-1 min-w-0 pr-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
    </div>
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-border"}`}
      aria-label={title}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  </div>
);

export default AddCrop;