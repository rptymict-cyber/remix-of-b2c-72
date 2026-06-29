import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Bell, Bookmark, ChevronRight, Store, GripVertical, Info, Scale, Star, Trash2, Search, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PriceSparkline from "@/components/PriceSparkline";
import { useApp } from "@/store/appStore";
import {
  findCrop,
  findMarket,
  seedPrice,
  seedPriceHistory,
  CROPS,
  MARKETS,
} from "@/data/catalog";
import { CATEGORIES, REPRESENTATIVE_CROPS, searchCrops, filterByCategory, type CropCategory } from "@/data/cropCatalog";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type WatchTab = "myCrops" | "interests" | "markets";

const PRIMARY = "hsl(150 55% 38%)";
const LIGHT_GREEN_BG = "hsl(150 55% 94%)";
const DANGER = "hsl(0 72% 50%)";

// 시장별 오늘 거래량 상위 3개 작물을 시뮬레이션으로 계산한다.
// 실제 API 연동 시: GET /markets/:id/top-crops?metric=volume&limit=3 응답으로 대체.
// 각 항목: { cropId, todayVolumeTon, currentPrice(기준단위), changePctVsYesterday }
interface MarketTopCrop {
  cropId: string;
  volumeTon: number;
  price: number;
  unitKg: number;
  changePct: number;
  isUp: boolean;
}

const getMarketTopCrops = (marketId: string, limit = 3): MarketTopCrop[] => {
  // 모든 작물에 대해 (작물,시장) 시드로 오늘 거래량(t) 점수를 만든다.
  const scored = CROPS.map((c) => {
    const seed = [...(c.id + marketId)].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const volumeTon = 8 + (seed % 142); // 8 ~ 149t
    const variety = c.varieties[0] ?? "";
    const price = seedPrice(c.id, marketId, variety);
    const dSeed = (seed * 7) % 199;
    const isUp = dSeed % 2 === 0;
    const changePct = ((dSeed % 13) + 1) * 0.6 * (isUp ? 1 : -1); // ±0.6 ~ ±7.8%
    return { cropId: c.id, volumeTon, price, unitKg: c.defaultUnitKg, changePct, isUp };
  });
  scored.sort((a, b) => b.volumeTon - a.volumeTon);
  return scored.slice(0, limit);
};

const MARKET_STATUS: Record<string, string> = {
  garak: "경매 진행중",
  daegu: "경매 진행중",
  busan: "일부 품목 경매 완료",
  anyang: "경매 진행중",
  gwangju: "경매 진행중",
  gangseo: "경매 진행중",
  suwon: "경매 진행중",
  cheongju: "경매 진행중",
};

const seedRatio = (a: string, b: string) => {
  const seed = (a.charCodeAt(0) + b.charCodeAt(0)) % 11;
  const up = seed % 2 === 0;
  const pct = ((seed % 7) + 1) * (up ? 1 : -1);
  const volSeed = (a.charCodeAt(0) * 3 + b.charCodeAt(0)) % 13;
  const volUp = volSeed % 2 === 0;
  const volPct = ((volSeed % 9) + 1) * 2.3 * (volUp ? 1 : -1);
  return { up, pct, volUp, volPct };
};

// ====== Tab bar ======
const TabBar = ({ activeTab, onTabChange }: { activeTab: WatchTab; onTabChange: (t: WatchTab) => void }) => {
  const tabs: { id: WatchTab; label: string }[] = [
    { id: "myCrops", label: "내 작물" },
    { id: "interests", label: "관심 품목" },
    { id: "markets", label: "즐겨찾기 시장" },
  ];
  return (
    <div className="grid grid-cols-3 border-b border-border">
      {tabs.map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`min-h-11 py-2.5 text-[13.5px] font-bold transition-all relative ${
              active ? "text-[hsl(150_55%_38%)]" : "text-muted-foreground"
            }`}
          >
            {t.label}
            {active && (
              <span className="absolute bottom-[-1px] left-3 right-3 h-[2.5px] rounded-full" style={{ background: PRIMARY }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

// ====== Info banner ======
const InfoBanner = ({ icon, message }: { icon: React.ReactNode; message: string }) => (
  <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: LIGHT_GREEN_BG }}>
    <div className="shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center" style={{ color: PRIMARY }}>
      {icon}
    </div>
    <p className="flex-1 text-[12.5px] leading-relaxed text-foreground/85">{message}</p>
  </div>
);

// ====== Edit info card (bottom) ======
const EditHint = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: LIGHT_GREEN_BG }}>
    <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: PRIMARY }} />
    <p className="text-[12px] leading-relaxed text-foreground/85">{children}</p>
  </div>
);

// ====== Edit header ======
const EditHeader = ({
  title,
  desc,
  onDone,
}: {
  title: string;
  desc: string;
  onDone: () => void;
}) => (
  <div className="px-1">
    <div className="flex items-center justify-between">
      <h2 className="text-[16px] font-extrabold text-foreground">{title}</h2>
      <button onClick={onDone} className="text-[13.5px] font-bold" style={{ color: PRIMARY }}>
        완료
      </button>
    </div>
    <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
  </div>
);

// ====== Empty state ======
const EmptyState = ({
  message, subMessage, buttonLabel, onAction,
}: { message: string; subMessage: string; buttonLabel: string; onAction: () => void }) => (
  <div className="bg-white border border-dashed border-border rounded-2xl p-7 text-center">
    <p className="text-[14px] font-bold text-foreground mb-1.5">{message}</p>
    <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">{subMessage}</p>
    <button onClick={onAction} className="min-h-11 px-5 rounded-xl text-white text-[13px] font-bold" style={{ background: PRIMARY }}>
      {buttonLabel}
    </button>
  </div>
);

// ====== Drag helpers ======
function useDragReorder<T>(items: T[], onReorder: (next: T[]) => void) {
  const dragIndex = useRef<number | null>(null);
  const onDragStart = (i: number) => () => { dragIndex.current = i; };
  const onDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = i;
    onReorder(next);
  };
  const onDragEnd = () => { dragIndex.current = null; };
  return { onDragStart, onDragOver, onDragEnd };
}

// ====== My Crops Tab ======
const MyCropsTab = ({
  showBanner, isEditing, onEdit, onDone,
}: { showBanner: boolean; isEditing: boolean; onEdit: () => void; onDone: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, setProfile, setCrop, setMarket, removeMyCrop } = useApp();
  const myCropList = profile.myCrops.map((id) => findCrop(id));
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const drag = useDragReorder(profile.myCrops, (next) => setProfile({ myCrops: next }));

  const confirmCrop = confirmId ? findCrop(confirmId) : null;
  const confirmVariety = confirmCrop?.varieties[0] ?? "";

  return (
    <div className="space-y-3">
      {!isEditing && showBanner && (
        <InfoBanner
          icon={<span className="text-base leading-none">🌱</span>}
          message="내가 재배하거나 관리하는 작물의 시세를 빠르게 확인하고 알림을 설정할 수 있습니다."
        />
      )}

      {isEditing ? (
        <EditHeader title="내 작물 편집" desc="홈과 관심 화면에 보일 순서를 바꿀 수 있어요." onDone={onDone} />
      ) : (
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13.5px] font-bold text-foreground">
            내 작물 <span className="ml-0.5">{myCropList.length}</span>
          </h2>
          {myCropList.length > 0 && (
            <button onClick={onEdit} className="text-[12.5px] font-semibold" style={{ color: PRIMARY }}>편집</button>
          )}
        </div>
      )}

      {myCropList.length === 0 ? (
        <EmptyState
          message="아직 등록한 내 작물이 없어요."
          subMessage="내가 재배하거나 관리하는 작물을 등록하면 시세를 빠르게 확인할 수 있어요."
          buttonLabel="내 작물 추가"
          onAction={() => navigate("/crop/add", { state: { returnTo: window.location.pathname + window.location.search } })}
        />
      ) : isEditing ? (
        /* ===== EDIT MODE ===== */
        <div className="space-y-2.5">
          {myCropList.map((crop, idx) => {
            const setting = profile.cropSettings?.[crop.id];
            const mktId = setting?.marketId ?? "garak";
            const vrty = crop.varieties[0];
            const mkt = findMarket(mktId);
            return (
              <div
                key={crop.id}
                draggable
                onDragStart={drag.onDragStart(idx)}
                onDragOver={drag.onDragOver(idx)}
                onDragEnd={drag.onDragEnd}
                className="bg-white border border-border rounded-2xl p-3.5 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground shrink-0 cursor-grab" />
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#F6F7F5] flex items-center justify-center text-2xl">
                    {crop.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {crop.name} <span className="text-muted-foreground font-medium">· {vrty}</span>
                    </p>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{mkt.name}</p>
                    <span
                      className="inline-flex items-center mt-1.5 text-[10.5px] font-semibold px-2 py-[2px] rounded-md"
                      style={{ color: PRIMARY, background: LIGHT_GREEN_BG }}
                    >
                      {crop.defaultUnitKg}kg 기준
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pl-8">
                  <button
                    onClick={() => navigate("/notification-settings")}
                    className="inline-flex items-center gap-1 min-h-9 px-3 rounded-lg bg-secondary text-[11.5px] font-semibold text-foreground"
                  >
                    <Bell className="w-3.5 h-3.5" /> 알림 설정
                  </button>
                  <button
                    onClick={() => navigate(`/crop-settings/${crop.id}`)}
                    className="inline-flex items-center gap-1 min-h-9 px-3 rounded-lg bg-secondary text-[11.5px] font-semibold text-foreground"
                  >
                    <Scale className="w-3.5 h-3.5" /> 기준 변경
                  </button>
                  <button
                    onClick={() => {
                      removeMyCrop(crop.id);
                      toast({ description: `${crop.name}을(를) 삭제했어요` });
                    }}
                    className="ml-auto min-h-9 px-2 text-[12.5px] font-bold"
                    style={{ color: DANGER }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => navigate("/crop/add", { state: { returnTo: window.location.pathname + window.location.search } })}
            className="w-full min-h-12 rounded-2xl border border-dashed text-[13px] font-bold flex items-center justify-center gap-1.5"
            style={{ borderColor: "hsl(150 55% 70%)", color: PRIMARY }}
          >
            <Plus className="w-4 h-4" /> 내 작물 추가
          </button>

          <EditHint>순서를 변경하면 홈과 시세 화면의 내 작물 순서가 함께 변경됩니다.</EditHint>

          <Sheet open={!!confirmId} onOpenChange={(v) => !v && setConfirmId(null)}>
            <SheetContent side="bottom" className="rounded-t-3xl p-5">
              <SheetHeader>
                <SheetTitle className="text-[16px] font-extrabold text-left">내 작물에서 삭제할까요?</SheetTitle>
              </SheetHeader>
              <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                {confirmCrop?.name}{confirmVariety && ` · ${confirmVariety}`}을(를) 내 작물에서 삭제합니다.
                가격 알림과 기준 시장 설정도 함께 해제될 수 있어요.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button onClick={() => setConfirmId(null)} className="min-h-12 rounded-xl bg-secondary text-foreground text-[13.5px] font-bold">
                  취소
                </button>
                <button
                  onClick={() => {
                    if (confirmId) {
                      removeMyCrop(confirmId);
                      toast({ description: `${confirmCrop?.name}을(를) 삭제했어요` });
                    }
                    setConfirmId(null);
                  }}
                  className="min-h-12 rounded-xl text-white text-[13.5px] font-bold"
                  style={{ background: DANGER }}
                >
                  삭제
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        /* ===== VIEW MODE ===== */
        <div className="bg-white border border-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}>
          {myCropList.map((crop, idx) => {
            const setting = profile.cropSettings?.[crop.id];
            const mktId = setting?.marketId ?? "garak";
            const vrty = crop.varieties[0];
            const mkt = findMarket(mktId);
            const price = seedPrice(crop.id, mktId, vrty);
            const history = seedPriceHistory(crop.id, mktId, vrty, 7);
            const { up, pct, volUp, volPct } = seedRatio(crop.id, mktId);
            return (
              <div key={crop.id}>
                {idx > 0 && <div className="h-px bg-border mx-4" />}
                <button
                  onClick={() => { setCrop(crop.id, vrty); setMarket(mktId); navigate("/market"); }}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-secondary/50 transition-colors min-h-[72px]"
                >
                  <div className="shrink-0 w-11 h-11 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl">{crop.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {crop.name} <span className="text-muted-foreground font-medium">· {vrty}</span>
                    </p>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{mkt.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{crop.defaultUnitKg}kg 기준</p>
                  </div>
                  <PriceSparkline data={history} width={56} height={26} showMarker={false} className="w-14 h-7 shrink-0" />
                  <div className="shrink-0 flex flex-col items-end ml-1">
                    <span className="text-[14px] font-extrabold text-foreground leading-none">{price.toLocaleString()}원</span>
                    <span className={`text-[11px] font-bold mt-1 leading-none ${up ? "price-up" : "price-down"}`}>
                      {up ? "+" : ""}{pct.toFixed(1)}%
                    </span>
                    <span className={`text-[10.5px] font-semibold mt-1 leading-none ${volUp ? "price-up" : "price-down"}`}>
                      거래량 {volUp ? "+" : ""}{volPct.toFixed(1)}%
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 작물 관리 (view 모드만) */}
      {!isEditing && myCropList.length > 0 && (
        <>
          <button
            onClick={() => navigate("/crop/add", { state: { returnTo: window.location.pathname + window.location.search } })}
            className="w-full min-h-12 rounded-2xl border border-dashed text-[13px] font-bold flex items-center justify-center gap-1.5"
            style={{ borderColor: "hsl(150 55% 70%)", color: PRIMARY }}
          >
            <Plus className="w-4 h-4" /> 내 작물 추가
          </button>
          <div className="bg-white border border-border rounded-2xl p-4" style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}>
            <p className="text-[13px] font-bold text-foreground mb-3">작물 관리</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Bell className="w-5 h-5" />, label: "가격 알림\n설정", to: "/notification-settings" },
                { icon: <Scale className="w-5 h-5" />, label: "기준 단량\n설정", to: "/mypage" },
                { icon: <Store className="w-5 h-5" />, label: "기준 시장\n설정", to: "/mypage" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.to)}
                  className="flex flex-col items-center justify-center gap-1.5 min-h-[72px] rounded-xl bg-secondary/60 active:bg-secondary"
                  style={{ color: PRIMARY }}
                >
                  {item.icon}
                  <span className="text-[11px] font-semibold text-foreground text-center whitespace-pre-line leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ====== Interests Tab ======
const InterestsTab = ({
  showBanner, isEditing, onEdit, onDone, onOpenAdd,
}: { showBanner: boolean; isEditing: boolean; onEdit: () => void; onDone: () => void; onOpenAdd: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, setProfile, setCrop, setMarket, toggleInterestCrop } = useApp();
  const ids = profile.interestCrops ?? [];
  const interestCrops = ids.map((id) => findCrop(id));
  const drag = useDragReorder(ids, (next) => setProfile({ interestCrops: next }));

  const removeInterest = (id: string, name: string) => {
    toggleInterestCrop(id);
    toast({
      description: `${name}가(이) 관심 품목에서 해제되었습니다.`,
    });
  };

  return (
    <div className="space-y-3">
      {!isEditing && showBanner && (
        <InfoBanner
          icon={<Bookmark className="w-3.5 h-3.5" fill="currentColor" />}
          message="자주 보는 품목을 관심 품목으로 등록하면 홈과 시세 화면에서 빠르게 확인할 수 있습니다."
        />
      )}

      {isEditing ? (
        <EditHeader title="관심 품목 편집" desc="자주 보는 품목의 순서를 바꾸거나 관심을 해제할 수 있어요." onDone={onDone} />
      ) : (
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13.5px] font-bold text-foreground">
            관심 품목 <span className="ml-0.5">{interestCrops.length}</span>
          </h2>
          {interestCrops.length > 0 && (
            <button onClick={onEdit} className="text-[12.5px] font-semibold" style={{ color: PRIMARY }}>편집</button>
          )}
        </div>
      )}

      {interestCrops.length === 0 ? (
        <EmptyState
          message="관심 품목이 없어요."
          subMessage="자주 보는 품목을 저장해두면 홈과 시세에서 빠르게 확인할 수 있어요."
          buttonLabel="관심 품목 추가"
          onAction={onOpenAdd}
        />
      ) : isEditing ? (
        /* ===== EDIT MODE ===== */
        <div className="space-y-2.5">
          {interestCrops.map((crop, idx) => {
            const mktId = "garak";
            const vrty = crop.varieties[0];
            const mkt = findMarket(mktId);
            const { up, pct, volUp, volPct } = seedRatio(crop.id, mktId);
            return (
              <div
                key={crop.id}
                draggable
                onDragStart={drag.onDragStart(idx)}
                onDragOver={drag.onDragOver(idx)}
                onDragEnd={drag.onDragEnd}
                className="bg-white border border-border rounded-2xl p-3.5 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground shrink-0 cursor-grab" />
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#F6F7F5] flex items-center justify-center text-2xl">{crop.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{crop.name}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{mkt.name}</p>
                    <span
                      className="inline-flex items-center mt-1.5 text-[10.5px] font-semibold px-2 py-[2px] rounded-md"
                      style={{ color: PRIMARY, background: LIGHT_GREEN_BG }}
                    >
                      {crop.defaultUnitKg}kg 기준
                    </span>
                  </div>
                  <Bookmark className="w-5 h-5 shrink-0" fill="currentColor" style={{ color: PRIMARY }} />
                </div>
                <div className="flex items-center justify-between mt-2.5 pl-8">
                  <p className="text-[11.5px] text-foreground/80">
                    가격 <span className={`font-bold ${up ? "price-up" : "price-down"}`}>{up ? "+" : ""}{pct.toFixed(1)}%</span>
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    거래량 <span className={`font-bold ${volUp ? "price-up" : "price-down"}`}>{volUp ? "+" : ""}{volPct.toFixed(1)}%</span>
                  </p>
                  <button
                    onClick={() => removeInterest(crop.id, crop.name)}
                    className="min-h-9 px-2 text-[12.5px] font-bold"
                    style={{ color: DANGER }}
                  >
                    관심 해제
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={onOpenAdd}
            className="w-full min-h-12 rounded-2xl border border-dashed text-[13px] font-bold flex items-center justify-center gap-1.5"
            style={{ borderColor: "hsl(150 55% 70%)", color: PRIMARY }}
          >
            <Plus className="w-4 h-4" /> 관심 품목 추가
          </button>

          <EditHint>관심을 해제하면 목록에서 제거되며, 언제든 다시 추가할 수 있어요.</EditHint>
        </div>
      ) : (
        /* ===== VIEW MODE ===== */
        <div className="bg-white border border-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}>
          {interestCrops.map((crop, idx) => {
            const mktId = "garak";
            const vrty = crop.varieties[0];
            const mkt = findMarket(mktId);
            const price = seedPrice(crop.id, mktId, vrty);
            const history = seedPriceHistory(crop.id, mktId, vrty, 7);
            const { up, pct, volUp, volPct } = seedRatio(crop.id, mktId);
            return (
              <div key={crop.id}>
                {idx > 0 && <div className="h-px bg-border mx-4" />}
                <button
                  onClick={() => navigate(`/interest/${crop.id}`)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-secondary/50 transition-colors min-h-[76px]"
                >
                  <div className="shrink-0 w-11 h-11 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl">{crop.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{crop.name}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{mkt.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{crop.defaultUnitKg}kg 기준</p>
                  </div>
                  <PriceSparkline data={history} width={56} height={26} showMarker={false} className="w-14 h-7 shrink-0" />
                  <div className="shrink-0 flex flex-col items-end ml-1">
                    <span className="text-[14px] font-extrabold text-foreground leading-none">{price.toLocaleString()}원</span>
                    <span className={`text-[11px] font-bold mt-1 leading-none ${up ? "price-up" : "price-down"}`}>{up ? "+" : ""}{pct.toFixed(1)}%</span>
                    <span className={`text-[10.5px] font-semibold mt-1 leading-none ${volUp ? "price-up" : "price-down"}`}>거래량 {volUp ? "+" : ""}{volPct.toFixed(1)}%</span>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="관심 해제"
                    onClick={(e) => { e.stopPropagation(); removeInterest(crop.id, crop.name); }}
                    className="shrink-0 w-9 h-9 flex items-center justify-center ml-1"
                    style={{ color: PRIMARY }}
                  >
                    <Bookmark className="w-4 h-4" fill="currentColor" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!isEditing && (
        <>
          <button
            onClick={onOpenAdd}
            className="w-full min-h-12 rounded-2xl border border-dashed text-[13px] font-bold flex items-center justify-center gap-1.5"
            style={{ borderColor: "hsl(150 55% 70%)", color: PRIMARY }}
          >
            <Plus className="w-4 h-4" /> 관심 품목 추가
          </button>

        </>
      )}
    </div>
  );
};

// ====== Add Market Sheet ======
const REGION_FILTER_CHIPS = ["전체", "서울/경기", "영남", "호남", "충청"] as const;
type RegionFilter = (typeof REGION_FILTER_CHIPS)[number];

const MARKET_STATUS_STYLE = (status: string) => {
  if (status === "경매 진행중") return { background: "hsl(150 55% 94%)", color: "hsl(150 55% 38%)" };
  if (status === "일부 완료") return { background: "hsl(40 80% 90%)", color: "hsl(40 80% 35%)" };
  return { background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" };
};

const AddMarketSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { profile, toggleFavMarket } = useApp();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<RegionFilter>("전체");

  const favIds = profile.favMarkets ?? [];
  const q = search.trim().toLowerCase();
  const filtered = MARKETS.filter((m) => {
    if (region !== "전체" && m.regionGroup !== region) return false;
    if (q && !(m.name.toLowerCase().includes(q) || m.region.toLowerCase().includes(q))) return false;
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[16px] font-extrabold text-left">시장 추가</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="mt-4 mb-3 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="시장명 또는 지역 검색"
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="검색어 지우기">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Region chips */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {REGION_FILTER_CHIPS.map((r) => {
            const active = region === r;
            return (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  active ? "text-white" : "bg-secondary text-muted-foreground"
                }`}
                style={active ? { background: PRIMARY } : undefined}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Market list */}
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm font-semibold text-foreground">검색 결과가 없어요</p>
            <p className="text-xs text-muted-foreground mt-1">다른 시장명이나 지역으로 검색해보세요</p>
          </div>
        ) : (
          <div>
            {filtered.map((market, i) => {
              const isFav = favIds.includes(market.id);
              const status = MARKET_STATUS[market.id] ?? "경매 진행중";
              const statusStyle = MARKET_STATUS_STYLE(status);
              return (
                <div
                  key={market.id}
                  className={`flex items-center gap-3 px-1 py-3 min-h-16 ${
                    i < filtered.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">🏪</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{market.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{market.region}</p>
                    <span
                      className="inline-flex items-center mt-[3px] px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={statusStyle}
                    >
                      {status}
                    </span>
                  </div>
                  {isFav ? (
                    <button
                      onClick={() => {
                        toggleFavMarket(market.id);
                        toast({ description: "즐겨찾기에서 제거했어요" });
                      }}
                      aria-label="즐겨찾기 해제"
                      className="shrink-0 w-9 h-9 flex items-center justify-center"
                      style={{ color: "hsl(42 95% 55%)" }}
                    >
                      <Star className="w-5 h-5" fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        toggleFavMarket(market.id);
                        toast({ description: `${market.name}을(를) 즐겨찾기에 추가했어요` });
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                      style={{ background: LIGHT_GREEN_BG, color: PRIMARY }}
                    >
                      + 추가
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          탭하면 즐겨찾기에 추가돼요. 언제든 해제할 수 있어요.
        </p>
      </SheetContent>
    </Sheet>
  );
};

// ====== Markets Tab ======
const MarketsTab = ({
  showBanner, isEditing, onEdit, onDone, onOpenAdd,
}: { showBanner: boolean; isEditing: boolean; onEdit: () => void; onDone: () => void; onOpenAdd: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, setProfile, marketId, setMarket, toggleFavMarket } = useApp();
  const ids = profile.favMarkets ?? [];
  const favMarkets = ids.map((id) => findMarket(id));
  const addableMarkets = MARKETS.filter((m) => !ids.includes(m.id));
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const drag = useDragReorder(ids, (next) => setProfile({ favMarkets: next }));

  const confirmMarket = confirmId ? findMarket(confirmId) : null;

  return (
    <div className="space-y-3">
      {!isEditing && showBanner && (
        <InfoBanner
          icon={<Store className="w-3.5 h-3.5" />}
          message="자주 보는 도매시장을 즐겨찾기하면 시장별 주요 품목 시세를 빠르게 확인할 수 있습니다."
        />
      )}

      {isEditing ? (
        <EditHeader title="즐겨찾기 시장 편집" desc="자주 보는 시장의 순서를 바꾸거나 대표 시장을 설정할 수 있어요." onDone={onDone} />
      ) : (
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13.5px] font-bold text-foreground">
            즐겨찾기 시장 <span className="ml-0.5">{favMarkets.length}</span>
          </h2>
          {favMarkets.length > 0 && (
            <button onClick={onEdit} className="text-[12.5px] font-semibold" style={{ color: PRIMARY }}>편집</button>
          )}
        </div>
      )}

      {favMarkets.length === 0 ? (
        <EmptyState
          message="즐겨찾기한 시장이 없어요."
          subMessage="자주 보는 도매시장을 저장해두면 시장별 시세를 빠르게 볼 수 있어요."
          buttonLabel="시장 추가하기"
          onAction={onOpenAdd}
        />
      ) : isEditing ? (
        /* ===== EDIT MODE ===== */
        <div className="space-y-2.5">
          {favMarkets.map((market, idx) => {
            const isPrimary = marketId === market.id;
            return (
              <div
                key={market.id}
                draggable
                onDragStart={drag.onDragStart(idx)}
                onDragOver={drag.onDragOver(idx)}
                onDragEnd={drag.onDragEnd}
                className="bg-white border border-border rounded-2xl p-3.5 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground shrink-0 cursor-grab" />
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#F0F4EE] flex items-center justify-center text-2xl">🏪</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{market.name}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{market.region}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIMARY }} />
                        오늘 14:30 업데이트
                      </span>
                    </div>
                    <span
                      className="inline-flex items-center mt-1 text-[10.5px] font-semibold px-2 py-[2px] rounded-md"
                      style={{ color: PRIMARY, background: LIGHT_GREEN_BG }}
                    >
                      {MARKET_STATUS[market.id] ?? "경매 진행중"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pl-8">
                  <button
                    onClick={() => {
                      if (!isPrimary) {
                        setMarket(market.id);
                        toast({ description: `${market.name}이(가) 대표 시장으로 설정되었습니다.` });
                      }
                    }}
                    className={`inline-flex items-center gap-1 min-h-9 px-3 rounded-lg text-[11.5px] font-bold ${
                      isPrimary ? "" : "bg-white border border-border text-foreground"
                    }`}
                    style={isPrimary ? { background: LIGHT_GREEN_BG, color: PRIMARY } : undefined}
                  >
                    <Star className="w-3.5 h-3.5" fill={isPrimary ? "currentColor" : "none"} />
                    {isPrimary ? "대표 시장" : "대표 설정"}
                  </button>
                  <button
                    onClick={() => setConfirmId(market.id)}
                    className="min-h-9 px-2 text-[12.5px] font-bold"
                    style={{ color: DANGER }}
                  >
                    즐겨찾기 해제
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={onOpenAdd}
            className="w-full min-h-12 rounded-2xl border border-dashed text-[13px] font-bold flex items-center justify-center gap-1.5"
            style={{ borderColor: "hsl(150 55% 70%)", color: PRIMARY }}
          >
            <Plus className="w-4 h-4" /> 시장 추가하기
          </button>

          <EditHint>대표 시장은 홈과 시세 화면의 기본 시장으로 사용됩니다.</EditHint>

          <Sheet open={!!confirmId} onOpenChange={(v) => !v && setConfirmId(null)}>
            <SheetContent side="bottom" className="rounded-t-3xl p-5">
              <SheetHeader>
                <SheetTitle className="text-[16px] font-extrabold text-left">즐겨찾기에서 해제할까요?</SheetTitle>
              </SheetHeader>
              <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                {confirmMarket?.name}을(를) 즐겨찾기 시장에서 제거합니다.
                나중에 다시 추가할 수 있어요.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button onClick={() => setConfirmId(null)} className="min-h-12 rounded-xl bg-secondary text-foreground text-[13.5px] font-bold">
                  취소
                </button>
                <button
                  onClick={() => {
                    if (confirmId) {
                      toggleFavMarket(confirmId);
                      toast({ description: `${confirmMarket?.name}을(를) 즐겨찾기에서 해제했어요` });
                    }
                    setConfirmId(null);
                  }}
                  className="min-h-12 rounded-xl text-white text-[13.5px] font-bold"
                  style={{ background: DANGER }}
                >
                  해제
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        /* ===== VIEW MODE ===== */
        <div className="space-y-3">
          {favMarkets.map((market) => {
            const topCrops = getMarketTopCrops(market.id, 3).map((t) => ({
              ...t,
              crop: findCrop(t.cropId),
            }));
            return (
              <div key={market.id} className="bg-white border border-border rounded-2xl p-3.5" style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#F0F4EE] flex items-center justify-center text-2xl">🏪</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14.5px] font-bold text-foreground truncate">{market.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{market.region}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIMARY }} />
                        오늘 14:00 업데이트
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10.5px] font-semibold text-muted-foreground bg-secondary px-1.5 py-[2px] rounded-md">
                        주요 품목 {80 + (market.id.charCodeAt(0) % 50)}개
                      </span>
                      <span className="text-[10.5px] font-semibold px-1.5 py-[2px] rounded-md" style={{ color: PRIMARY, background: LIGHT_GREEN_BG }}>
                        {MARKET_STATUS[market.id] ?? "경매 진행중"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { toggleFavMarket(market.id); toast({ description: "즐겨찾기에서 제거했어요" }); }}
                    aria-label="즐겨찾기 해제"
                    className="shrink-0 w-8 h-8 flex items-center justify-center"
                    style={{ color: PRIMARY }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                      <polygon points="12 2.7 14.9 9 21.6 9.7 16.5 14.3 18 21 12 17.5 6 21 7.5 14.3 2.4 9.7 9.1 9" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 mb-2">
                  <p className="text-[11.5px] font-bold text-foreground">오늘 거래량 TOP 3</p>
                  <span className="text-[10px] text-muted-foreground">전일 대비</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {topCrops.map(({ crop, price, unitKg, changePct, isUp, volumeTon }, i) => {
                    const perKg = Math.round(price / unitKg);
                    return (
                      <div key={crop.id} className="text-left rounded-xl bg-secondary/40 p-2">
                        <p className="text-[10px] font-bold" style={{ color: PRIMARY }}>{i + 1}위 · {volumeTon}t</p>
                        <p className="text-[11.5px] text-foreground flex items-center gap-0.5 truncate mt-0.5">
                          <span className="text-sm leading-none">{crop.emoji}</span>
                          <span className="truncate font-semibold">{crop.name}</span>
                        </p>
                        <p className="text-[13px] font-extrabold text-foreground mt-1 leading-tight">
                          {price.toLocaleString()}원
                          <span className="text-[10px] font-medium text-muted-foreground">/{unitKg}kg</span>
                        </p>
                        <p className={`text-[10.5px] font-bold mt-0.5 ${isUp ? "price-up" : "price-down"}`}>
                          {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(1)}%
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          ≒ {perKg.toLocaleString()}원/kg
                        </p>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setMarket(market.id); navigate("/market"); }}
                  className="mt-3 w-full min-h-10 rounded-xl bg-secondary text-[12.5px] font-bold flex items-center justify-center gap-1"
                  style={{ color: PRIMARY }}
                >
                  바로 시세 보기
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!isEditing && addableMarkets.length > 0 && (
        <button
          onClick={onOpenAdd}
          className="w-full min-h-12 rounded-2xl border border-dashed text-[13px] font-bold flex items-center justify-center gap-1.5"
          style={{ borderColor: "hsl(150 55% 70%)", color: PRIMARY }}
        >
          <Plus className="w-4 h-4" /> 시장 추가하기
        </button>
      )}
    </div>
  );
};

// ====== Add Interest Sheet ======
const AddInterestSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { profile, toggleInterestCrop } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CropCategory | "전체">("전체");

  const list = (() => {
    const trimmed = q.trim();
    if (trimmed) {
      const base = searchCrops(trimmed);
      return cat === "전체" ? base : base.filter((c) => c.category === cat);
    }
    if (cat === "전체") return REPRESENTATIVE_CROPS;
    return filterByCategory(cat);
  })();

  const interestIds = profile.interestCrops ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[16px] font-extrabold text-left">관심 품목 추가</SheetTitle>
        </SheetHeader>
        <p className="text-[12px] text-muted-foreground mt-1 mb-4 text-left">
          자주 보는 품목을 추가하면 시세를 빠르게 확인할 수 있어요
        </p>

        {/* Search */}
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5 mb-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="작물명 검색"
            className="flex-1 text-sm bg-transparent outline-none border-none placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="검색어 지우기">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {(["전체", ...CATEGORIES] as const).map((c) => {
            const active = cat === c;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active ? "text-white" : "text-muted-foreground bg-secondary"
                }`}
                style={active ? { background: PRIMARY } : undefined}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {list.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-sm font-semibold text-foreground">검색 결과가 없어요</p>
            <p className="text-xs text-muted-foreground mt-1">다른 작물명으로 검색해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {list.slice(0, 60).map((crop) => {
              const added = interestIds.includes(crop.id);
              return (
                <button
                  key={crop.id}
                  onClick={() => toggleInterestCrop(crop.id)}
                  className="relative bg-white rounded-2xl py-3 px-2 text-center shadow-sm transition-colors"
                  style={{
                    border: `2px solid ${added ? PRIMARY : "transparent"}`,
                    background: added ? "hsl(150 55% 97%)" : "#fff",
                  }}
                >
                  {added && (
                    <Bookmark
                      className="w-3.5 h-3.5 absolute top-1.5 right-1.5"
                      fill="currentColor"
                      style={{ color: PRIMARY }}
                    />
                  )}
                  <span className="block text-[28px] mb-1.5 leading-none">{crop.icon}</span>
                  <span className="block text-[13px] font-bold text-foreground truncate">{crop.name}</span>
                  {added && (
                    <span className="block text-[10px] font-semibold mt-[3px]" style={{ color: PRIMARY }}>
                      추가됨
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={() => onOpenChange(false)}
          className="w-full min-h-12 rounded-2xl text-white text-[15px] font-bold mt-3"
          style={{ background: PRIMARY }}
        >
          완료
        </button>
      </SheetContent>
    </Sheet>
  );
};

// ====== Page ======
const Watchlist = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: WatchTab =
    tabParam === "interest" ? "interests" :
    tabParam === "mine" ? "myCrops" :
    tabParam === "markets" ? "markets" : "myCrops";
  const [activeTab, setActiveTab] = useState<WatchTab>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [showMyCropsBanner, setShowMyCropsBanner] = useState(true);
  const [showInterestBanner, setShowInterestBanner] = useState(true);
  const [showMarketBanner, setShowMarketBanner] = useState(true);
  const [marketAddOpen, setMarketAddOpen] = useState(false);
  const [interestAddOpen, setInterestAddOpen] = useState(false);

  useEffect(() => {
    if (tabParam === "interest") setActiveTab("interests");
    else if (tabParam === "mine") setActiveTab("myCrops");
    else if (tabParam === "markets") setActiveTab("markets");
  }, [tabParam]);

  const changeTab = (t: WatchTab) => {
    setIsEditing(false);
    setActiveTab(t);
  };

  return (
    <div className="h-full bg-background">
      <AppHeader
        title="관심"
        rightAction={
          activeTab === "markets" ? (
            <button
              onClick={() => setMarketAddOpen(true)}
              aria-label="시장 추가"
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ color: PRIMARY }}
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : activeTab === "interests" ? (
            <button
              onClick={() => navigate("/crop/add?mode=interest", { state: { returnTo: "/watchlist?tab=interest" } })}
              aria-label="관심 품목 추가"
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ color: PRIMARY }}
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+0.75rem)] pb-28 safe-bottom space-y-3">
        <TabBar activeTab={activeTab} onTabChange={changeTab} />

        <div className="pt-1">
          {activeTab === "myCrops" && (
            <MyCropsTab
              showBanner={showMyCropsBanner}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onDone={() => setIsEditing(false)}
            />
          )}
          {activeTab === "interests" && (
            <InterestsTab
              showBanner={showInterestBanner}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onDone={() => setIsEditing(false)}
              onOpenAdd={() => navigate("/crop/add?mode=interest", { state: { returnTo: "/crop?tab=interest" } })}
            />
          )}
          {activeTab === "markets" && (
            <MarketsTab
              showBanner={showMarketBanner}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onDone={() => setIsEditing(false)}
              onOpenAdd={() => setMarketAddOpen(true)}
            />
          )}
        </div>
      </main>

      <AddMarketSheet open={marketAddOpen} onOpenChange={setMarketAddOpen} />
      <AddInterestSheet open={interestAddOpen} onOpenChange={setInterestAddOpen} />
      <BottomNav />
    </div>
  );
};

export default Watchlist;
