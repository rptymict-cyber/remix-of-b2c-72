import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Bell, BellOff, Star, Trash2, Store } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PriceSparkline from "@/components/PriceSparkline";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/store/appStore";
import {
  findCrop,
  findMarket,
  seedPrice,
  seedPriceHistory,
  MARKETS,
} from "@/data/catalog";

type Tab = "mine" | "interest" | "markets";

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

  const addLabel =
    profile.userType === "wholesaler"
      ? "취급 품목 추가"
      : profile.userType === "retailer" || profile.userType === "enterprise"
        ? "관심 품목 추가"
        : "내 작물 추가";

  // ---- 공통 row ----
  const CropRow = ({
    cropId,
    onAlert,
    onRemove,
    badge,
  }: {
    cropId: string;
    onAlert?: () => void;
    onRemove?: () => void;
    badge?: string;
  }) => {
    const c = findCrop(cropId);
    const setting = profile.cropSettings?.[cropId];
    const mId = setting?.marketId ?? marketId;
    const m = findMarket(mId);
    const v = c.varieties[0];
    const p = seedPrice(cropId, mId, v);
    const hist = seedPriceHistory(cropId, mId, v, 7);
    const seed = (cropId.charCodeAt(0) + mId.charCodeAt(0)) % 11;
    const up = seed % 2 === 0;
    const changePct = (((seed % 7) + 1) * (up ? 1 : -1)).toFixed(1);
    const priceColor = up ? "price-up" : "price-down";
    const display = Math.round((p / c.defaultUnitKg) * (unitKg || c.defaultUnitKg));

    return (
      <div className="bg-card rounded-2xl border border-border px-3 py-2.5">
        <button
          onClick={() => {
            setCrop(cropId, v);
            navigate("/market");
          }}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl shrink-0">
            {c.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13.5px] font-bold text-foreground truncate">{c.name}</span>
              {badge && (
                <span className="text-[9.5px] font-bold px-1.5 py-[1px] rounded-md bg-[hsl(150_55%_94%)] text-[hsl(150_55%_28%)]">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-muted-foreground truncate leading-tight mt-0.5">
              {m.name} · {unitKg || c.defaultUnitKg}kg
            </p>
          </div>
          <PriceSparkline data={hist} width={56} height={26} showMarker={false} className="w-14 h-7 shrink-0" />
          <div className="shrink-0 flex flex-col items-end ml-1.5">
            <span className="text-[13px] font-extrabold text-foreground leading-none">
              {display.toLocaleString()}
            </span>
            <span className={`text-[10.5px] font-bold mt-1 leading-none ${priceColor}`}>
              {up ? "+" : ""}{changePct}%
            </span>
          </div>
        </button>
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-dashed border-border">
          <button
            onClick={onAlert}
            className="flex-1 min-h-9 flex items-center justify-center gap-1 rounded-lg bg-secondary text-foreground text-[11.5px] font-semibold"
          >
            <Bell className="w-3.5 h-3.5" /> 알림 설정
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              aria-label="삭제"
              className="min-h-9 px-2.5 rounded-lg bg-secondary text-muted-foreground"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const goAlert = () => navigate("/notification-settings");

  return (
    <div className="h-full bg-background">
      <AppHeader title="관심" />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+0.75rem)] safe-bottom space-y-4">
        {/* 세그먼트 */}
        <div className="bg-secondary rounded-2xl p-1 grid grid-cols-3 gap-1">
          {([
            { id: "mine", label: `내 작물 ${profile.myCrops.length}` },
            { id: "interest", label: `관심 품목 ${interestCrops.length}` },
            { id: "markets", label: `시장 ${favMarkets.length}` },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-10 rounded-xl text-[12.5px] font-bold transition-colors ${
                tab === t.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 빠른 관리 카드 */}
        <section className="bg-card rounded-2xl border border-border px-3.5 py-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-[hsl(150_55%_38%)] shrink-0" />
          <p className="flex-1 text-[12px] text-muted-foreground leading-tight">
            기준 시장 <span className="font-bold text-foreground">{findMarket(marketId).name}</span> · 기준 단량{" "}
            <span className="font-bold text-foreground">{unitKg}kg</span>
          </p>
          <button
            onClick={() => navigate("/mypage")}
            className="shrink-0 text-[11px] font-bold text-primary"
          >
            변경
          </button>
        </section>

        {/* ===== 내 작물 ===== */}
        {tab === "mine" && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">내 작물</h2>
              <button
                onClick={() => {
                  if (profile.myCrops.length >= 3) {
                    toast({ description: "내 작물은 최대 3개까지 등록할 수 있어요" });
                    return;
                  }
                  navigate("/crop/add");
                }}
                className="text-[11.5px] font-bold text-primary flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" /> {addLabel}
              </button>
            </div>

            {profile.myCrops.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-3">아직 등록된 작물이 없어요.</p>
                <button
                  onClick={() => navigate("/crop/add")}
                  className="min-h-11 px-4 rounded-xl bg-primary text-white text-sm font-bold"
                >
                  작물 추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {profile.myCrops.map((id) => {
                  const setting = profile.cropSettings?.[id];
                  const reg = setting?.regType ?? "growing";
                  return (
                    <CropRow
                      key={id}
                      cropId={id}
                      badge={reg === "growing" ? "재배 중" : "관심"}
                      onAlert={goAlert}
                      onRemove={() => {
                        removeMyCrop(id);
                        toast({ description: "내 작물에서 삭제했어요" });
                      }}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ===== 관심 품목 ===== */}
        {tab === "interest" && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">관심 품목</h2>
              <button
                onClick={() => navigate("/search")}
                className="text-[11.5px] font-bold text-primary flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" /> 관심 품목 추가
              </button>
            </div>

            {interestCrops.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-3">관심 품목이 없어요. 검색에서 추가해 보세요.</p>
                <button
                  onClick={() => navigate("/search")}
                  className="min-h-11 px-4 rounded-xl bg-primary text-white text-sm font-bold"
                >
                  검색으로 가기
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {interestCrops.map((id) => (
                  <CropRow
                    key={id}
                    cropId={id}
                    onAlert={goAlert}
                    onRemove={() => {
                      toggleInterestCrop(id);
                      toast({ description: "관심 품목에서 삭제했어요" });
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== 즐겨찾기 시장 ===== */}
        {tab === "markets" && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">즐겨찾기 시장</h2>
              <span className="text-[11px] text-muted-foreground">{favMarkets.length}개</span>
            </div>

            <div className="space-y-1.5">
              {MARKETS.map((m) => {
                const fav = favMarkets.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border ${
                      fav ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-card"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setMarket(m.id);
                        navigate("/market");
                      }}
                      className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                    >
                      <Store className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">{m.name}</p>
                        <p className="text-[10.5px] text-muted-foreground truncate">{m.region}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        toggleFavMarket(m.id);
                        toast({ description: fav ? "즐겨찾기에서 제거했어요" : "즐겨찾기에 추가했어요" });
                      }}
                      aria-label={fav ? "즐겨찾기 해제" : "즐겨찾기"}
                      className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                        fav ? "text-[hsl(150_55%_38%)]" : "text-muted-foreground"
                      }`}
                    >
                      <Star className="w-4 h-4" fill={fav ? "currentColor" : "none"} strokeWidth={1.8} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 관리 항목 */}
        <section className="bg-card rounded-2xl border border-border divide-y divide-border">
          <button
            onClick={() => navigate("/notification-settings")}
            className="w-full flex items-center justify-between px-4 py-3.5 min-h-11"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bell className="w-4 h-4 text-muted-foreground" />
              가격 알림 설정
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/mypage")}
            className="w-full flex items-center justify-between px-4 py-3.5 min-h-11"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BellOff className="w-4 h-4 text-muted-foreground" />
              기준 단량 / 기준 시장 설정
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </section>

        <div className="h-4" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Watchlist;
