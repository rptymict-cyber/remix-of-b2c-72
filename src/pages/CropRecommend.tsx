import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Bell, Bookmark, Star, ChevronRight, Clock } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PriceSparkline from "@/components/PriceSparkline";
import { useToast } from "@/hooks/use-toast";
import { useApp, MAX_MY_CROPS } from "@/store/appStore";
import {
  findCrop,
  findMarket,
  seedPrice,
  seedPriceHistory,
  MARKETS,
  CROPS,
} from "@/data/catalog";

type Tab = "mine" | "interest" | "markets";

const RECOMMEND_INTEREST = ["radish", "green_onion", "sweet_potato", "lettuce"];

const Watchlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    profile,
    marketId,
    unitKg,
    setCrop,
    setMarket,
    removeMyCrop,
    toggleInterestCrop,
    toggleFavMarket,
  } = useApp();

  const [tab, setTab] = useState<Tab>("mine");
  const interestCrops = profile.interestCrops ?? [];
  const favMarkets = profile.favMarkets ?? [];

  // ---- + 버튼 컨텍스트 액션 ----
  const handleAdd = () => {
    if (tab === "mine") {
      if (profile.myCrops.length >= MAX_MY_CROPS) {
        toast({ description: `내 작물은 최대 ${MAX_MY_CROPS}개까지 등록할 수 있어요` });
        return;
      }

      navigate("/crop/add", { state: { returnTo: window.location.pathname + window.location.search } });
    } else if (tab === "interest") {
      navigate("/search");
    } else {
      // 시장 추가 - 검색이나 시장 시트 트리거
      toast({ description: "아래 시장 목록에서 ★를 눌러 추가하세요" });
    }
  };

  const goAlert = () => navigate("/notification-settings");

  // ---- 공통: 가격/변동률 계산 ----
  const calc = (cropId: string, mId: string, variety: string) => {
    const c = findCrop(cropId);
    const p = seedPrice(cropId, mId, variety);
    const hist = seedPriceHistory(cropId, mId, variety, 7);
    const baseUnit = unitKg || c.defaultUnitKg;
    const display = Math.round((p / c.defaultUnitKg) * baseUnit);
    const seed = (cropId.charCodeAt(0) + mId.charCodeAt(0)) % 11;
    const up = seed % 2 === 0;
    const pct = (((seed % 7) + 1) * (up ? 1 : -1));
    const volSeed = (cropId.charCodeAt(0) * 3 + mId.charCodeAt(0)) % 13;
    const volUp = volSeed % 2 === 0;
    const volPct = (((volSeed % 9) + 1) * 2.3 * (volUp ? 1 : -1));
    return { c, hist, display, up, pct, volPct, baseUnit };
  };

  // ====================== 내 작물 ROW ======================
  const MineRow = ({ cropId }: { cropId: string }) => {
    const setting = profile.cropSettings?.[cropId];
    const mId = setting?.marketId ?? marketId;
    const m = findMarket(mId);
    const c = findCrop(cropId);
    const variety = c.varieties[0];
    const { hist, display, up, pct, baseUnit } = calc(cropId, mId, variety);
    const priceColor = up ? "price-up" : "price-down";

    return (
      <div className="bg-card rounded-2xl border border-border p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCrop(cropId, variety);
              setMarket(mId);
              navigate("/market");
            }}
            className="flex-1 flex items-center gap-3 text-left min-w-0"
          >
            <div className="w-11 h-11 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl shrink-0">
              {c.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground truncate">
                {c.name} <span className="text-muted-foreground font-medium">· {variety}</span>
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {m.name} · {baseUnit}kg 기준
              </p>
            </div>
            <PriceSparkline data={hist} width={56} height={26} showMarker={false} className="w-14 h-7 shrink-0" />
            <div className="shrink-0 flex flex-col items-end ml-1.5">
              <span className="text-[14px] font-extrabold text-foreground leading-none">
                {display.toLocaleString()}원
              </span>
              <span className={`text-[11px] font-bold mt-1 leading-none ${priceColor}`}>
                {up ? "+" : ""}{pct.toFixed(1)}%
              </span>
            </div>
          </button>
          <button
            onClick={goAlert}
            aria-label="가격 알림"
            className="shrink-0 w-9 h-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center ml-1"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-dashed border-border">
          <button
            onClick={() => {
              setCrop(cropId, variety);
              setMarket(mId);
              navigate("/market");
            }}
            className="flex-1 min-h-9 rounded-lg bg-primary/[0.08] text-primary text-[12px] font-bold"
          >
            시세 보기
          </button>
          <button
            onClick={() => {
              removeMyCrop(cropId);
              toast({ description: "내 작물에서 삭제했어요" });
            }}
            className="min-h-9 px-3 rounded-lg bg-secondary text-muted-foreground text-[12px] font-semibold"
          >
            삭제
          </button>
        </div>
      </div>
    );
  };

  // ====================== 관심 품목 ROW ======================
  const InterestRow = ({ cropId }: { cropId: string }) => {
    const mId = marketId;
    const m = findMarket(mId);
    const c = findCrop(cropId);
    const variety = c.varieties[0];
    const { hist, display, up, pct, volPct, baseUnit } = calc(cropId, mId, variety);
    const priceColor = up ? "price-up" : "price-down";
    const volColor = volPct >= 0 ? "price-up" : "price-down";

    return (
      <div className="bg-card rounded-2xl border border-border p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCrop(cropId, variety);
              setMarket(mId);
              navigate("/market");
            }}
            className="flex-1 flex items-start gap-3 text-left min-w-0"
          >
            <div className="w-11 h-11 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl shrink-0">
              {c.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {m.name} · {baseUnit}kg 기준
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[11px] font-bold ${priceColor}`}>
                  가격 {up ? "+" : ""}{pct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-border">|</span>
                <span className={`text-[11px] font-bold ${volColor}`}>
                  거래량 {volPct >= 0 ? "+" : ""}{volPct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-[14px] font-extrabold text-foreground leading-none">
                {display.toLocaleString()}원
              </span>
              <PriceSparkline data={hist} width={56} height={22} showMarker={false} className="w-14 h-6" />
            </div>
          </button>
          <button
            onClick={() => {
              toggleInterestCrop(cropId);
              toast({ description: "관심 품목에서 제거했어요" });
            }}
            aria-label="관심 해제"
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[hsl(150_55%_38%)] ml-1"
          >
            <Bookmark className="w-4 h-4" fill="currentColor" />
          </button>
        </div>
      </div>
    );
  };

  // ====================== 즐겨찾기 시장 카드 ======================
  const MarketCard = ({ mId }: { mId: string }) => {
    const m = findMarket(mId);
    // 주요 품목 3개 (deterministic)
    const picks = CROPS.slice(
      m.id.charCodeAt(0) % (CROPS.length - 3),
      (m.id.charCodeAt(0) % (CROPS.length - 3)) + 3,
    );
    const totalItems = 80 + (m.id.charCodeAt(0) % 60);

    return (
      <div className="bg-card rounded-2xl border border-border p-3.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[14.5px] font-bold text-foreground truncate">{m.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {m.region} · 오늘 14:30 업데이트
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[hsl(150_55%_28%)] bg-[hsl(150_55%_94%)] px-1.5 py-[2px] rounded-md">
                <Clock className="w-3 h-3" /> 경매 진행중
              </span>
              <span className="text-[10.5px] text-muted-foreground">주요 품목 {totalItems}개</span>
            </div>
          </div>
          <button
            onClick={() => {
              toggleFavMarket(mId);
              toast({ description: "즐겨찾기에서 제거했어요" });
            }}
            aria-label="즐겨찾기 해제"
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[hsl(150_55%_38%)]"
          >
            <Star className="w-4 h-4" fill="currentColor" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-3 space-y-1.5">
          {picks.map((c) => {
            const variety = c.varieties[0];
            const { display, up, pct } = calc(c.id, mId, variety);
            return (
              <div key={c.id} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-1.5 text-foreground">
                  <span className="text-base leading-none">{c.emoji}</span>
                  <span className="font-semibold">{c.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{display.toLocaleString()}원</span>
                  <span className={`text-[11px] font-bold ${up ? "price-up" : "price-down"}`}>
                    {up ? "+" : ""}{pct.toFixed(1)}%
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            setMarket(mId);
            navigate("/market");
          }}
          className="mt-3 w-full min-h-10 rounded-xl bg-primary/[0.08] text-primary text-[12.5px] font-bold flex items-center justify-center gap-1"
        >
          바로 시세 보기 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // ====================== 빈 상태 ======================
  const EmptyState = ({ msg, desc, btn, onClick }: { msg: string; desc: string; btn: string; onClick: () => void }) => (
    <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center">
      <p className="text-[14px] font-bold text-foreground mb-1.5">{msg}</p>
      <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">{desc}</p>
      <button
        onClick={onClick}
        className="min-h-11 px-5 rounded-xl bg-primary text-white text-[13px] font-bold"
      >
        {btn}
      </button>
    </div>
  );

  return (
    <div className="h-full bg-background">
      <AppHeader
        title="관심"
        rightAction={
          <button
            onClick={handleAdd}
            aria-label="추가"
            className="w-8 h-8 rounded-full bg-primary/[0.08] text-primary flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+0.75rem)] safe-bottom space-y-4">
        {/* 세그먼트 */}
        <div className="bg-secondary rounded-2xl p-1 grid grid-cols-3 gap-1">
          {([
            { id: "mine", label: "내 작물" },
            { id: "interest", label: "관심 품목" },
            { id: "markets", label: "즐겨찾기 시장" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-10 rounded-xl text-[12.5px] font-bold transition-colors ${
                tab === t.id
                  ? "bg-white text-[hsl(150_55%_28%)] shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== 내 작물 ===== */}
        {tab === "mine" && (
          <>
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-foreground">
                  내 작물 <span className="text-muted-foreground font-medium">{profile.myCrops.length}</span>
                </h2>
                <span className="text-[11px] text-muted-foreground">최대 {MAX_MY_CROPS}개</span>
              </div>

              {profile.myCrops.length === 0 ? (
                <EmptyState
                  msg="아직 등록한 내 작물이 없어요."
                  desc="내가 재배하거나 관리하는 작물을 등록하면 시세를 빠르게 확인할 수 있어요."
                  btn="내 작물 추가"
                  onClick={() => navigate("/crop/add", { state: { returnTo: window.location.pathname + window.location.search } })}
                />
              ) : (
                <div className="space-y-2">
                  {profile.myCrops.map((id) => <MineRow key={id} cropId={id} />)}
                </div>
              )}
            </section>

            {/* 관리 메뉴 */}
            <section className="bg-card rounded-2xl border border-border divide-y divide-border">
              {[
                { label: "가격 알림 설정", to: "/notification-settings", icon: Bell },
                { label: "기준 단량 설정", to: "/mypage", icon: ChevronRight },
                { label: "기준 시장 설정", to: "/mypage", icon: ChevronRight },
              ].map((row) => (
                <button
                  key={row.label}
                  onClick={() => navigate(row.to)}
                  className="w-full flex items-center justify-between px-4 py-3.5 min-h-11"
                >
                  <span className="text-[13px] font-medium text-foreground">{row.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </section>
          </>
        )}

        {/* ===== 관심 품목 ===== */}
        {tab === "interest" && (
          <>
            <section className="space-y-2">
              <h2 className="text-[13px] font-bold text-foreground">
                관심 품목 <span className="text-muted-foreground font-medium">{interestCrops.length}</span>
              </h2>

              {interestCrops.length === 0 ? (
                <EmptyState
                  msg="관심 품목이 없어요."
                  desc="자주 보는 품목을 저장해두면 홈과 시세 화면에서 빠르게 확인할 수 있어요."
                  btn="관심 품목 추가"
                  onClick={() => navigate("/search")}
                />
              ) : (
                <div className="space-y-2">
                  {interestCrops.map((id) => <InterestRow key={id} cropId={id} />)}
                </div>
              )}
            </section>

            {/* 추천 관심 품목 */}
            <section className="space-y-2">
              <h2 className="text-[13px] font-bold text-foreground">추천 관심 품목</h2>
              <div className="flex flex-wrap gap-1.5">
                {RECOMMEND_INTEREST.filter((id) => !interestCrops.includes(id)).map((id) => {
                  const c = findCrop(id);
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        toggleInterestCrop(id);
                        toast({ description: `${c.name}을(를) 관심 품목에 추가했어요` });
                      }}
                      className="inline-flex items-center gap-1 min-h-9 px-3 rounded-full border border-border bg-card text-[12.5px] font-semibold text-foreground"
                    >
                      <span className="text-base leading-none">{c.emoji}</span>
                      {c.name}
                      <Plus className="w-3 h-3 text-primary ml-0.5" />
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ===== 즐겨찾기 시장 ===== */}
        {tab === "markets" && (
          <>
            <section className="space-y-2">
              <h2 className="text-[13px] font-bold text-foreground">
                즐겨찾기 시장 <span className="text-muted-foreground font-medium">{favMarkets.length}</span>
              </h2>

              {favMarkets.length === 0 ? (
                <EmptyState
                  msg="즐겨찾기한 시장이 없어요."
                  desc="자주 보는 도매시장을 저장해두면 시장별 시세를 빠르게 볼 수 있어요."
                  btn="시장 추가"
                  onClick={() => setTab("markets")}
                />
              ) : (
                <div className="space-y-2">
                  {favMarkets.map((mId) => <MarketCard key={mId} mId={mId} />)}
                </div>
              )}
            </section>

            {/* 추가 가능한 시장 */}
            <section className="space-y-2">
              <h2 className="text-[13px] font-bold text-foreground">시장 추가</h2>
              <div className="bg-card rounded-2xl border border-border divide-y divide-border">
                {MARKETS.filter((m) => !favMarkets.includes(m.id)).map((m) => (
                  <div key={m.id} className="flex items-center px-3.5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{m.region}</p>
                    </div>
                    <button
                      onClick={() => {
                        toggleFavMarket(m.id);
                        toast({ description: "즐겨찾기에 추가했어요" });
                      }}
                      aria-label="즐겨찾기 추가"
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground"
                    >
                      <Star className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="h-4" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Watchlist;
