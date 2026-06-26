import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Bell, Bookmark, ChevronRight, Store } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

type WatchTab = "myCrops" | "interests" | "markets";

const PRIMARY = "hsl(150 55% 38%)";
const LIGHT_GREEN_BG = "hsl(150 55% 94%)";

const MARKET_MAIN_CROPS: Record<string, string[]> = {
  garak: ["cabbage", "onion", "tomato"],
  daegu: ["onion", "radish", "green_onion"],
  busan: ["tomato", "strawberry", "cucumber"],
  anyang: ["cabbage", "apple", "radish"],
  gwangju: ["cabbage", "green_onion", "garlic"],
  gangseo: ["cabbage", "onion", "radish"],
  suwon: ["lettuce", "cabbage", "tomato"],
  cheongju: ["apple", "pear", "radish"],
};

const RECOMMEND_IDS = ["radish", "green_onion", "sweet_potato", "lettuce", "garlic", "potato"];

// ====== Tab bar ======
const TabBar = ({ activeTab, onTabChange }: { activeTab: WatchTab; onTabChange: (t: WatchTab) => void }) => {
  const tabs: { id: WatchTab; label: string }[] = [
    { id: "myCrops", label: "내 작물" },
    { id: "interests", label: "관심 품목" },
    { id: "markets", label: "즐겨찾기 시장" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 bg-secondary rounded-xl p-1">
      {tabs.map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`min-h-10 py-2 rounded-lg text-[13px] font-bold transition-all ${
              active
                ? "bg-white text-[hsl(150_55%_38%)] shadow-sm"
                : "text-muted-foreground"
            }`}
            style={active ? { boxShadow: "0 1px 2px rgba(0,0,0,0.04)" } : undefined}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

// ====== Info banner ======
const InfoBanner = ({
  icon,
  message,
  onClose,
}: {
  icon: React.ReactNode;
  message: string;
  onClose: () => void;
}) => (
  <div
    className="flex items-start gap-2.5 p-3 rounded-xl"
    style={{ background: LIGHT_GREEN_BG }}
  >
    <div className="shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center" style={{ color: PRIMARY }}>
      {icon}
    </div>
    <p className="flex-1 text-[12.5px] leading-relaxed text-foreground/85">{message}</p>
    <button onClick={onClose} aria-label="닫기" className="shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground">
      <X className="w-4 h-4" />
    </button>
  </div>
);

// ====== Empty state ======
const EmptyState = ({
  message,
  subMessage,
  buttonLabel,
  onAction,
}: {
  message: string;
  subMessage: string;
  buttonLabel: string;
  onAction: () => void;
}) => (
  <div className="bg-white border border-dashed border-border rounded-2xl p-7 text-center">
    <p className="text-[14px] font-bold text-foreground mb-1.5">{message}</p>
    <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">{subMessage}</p>
    <button
      onClick={onAction}
      className="min-h-11 px-5 rounded-xl text-white text-[13px] font-bold"
      style={{ background: PRIMARY }}
    >
      {buttonLabel}
    </button>
  </div>
);

// ====== My Crops Tab ======
const MyCropsTab = ({ showBanner, onCloseBanner }: { showBanner: boolean; onCloseBanner: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, setCrop, setMarket } = useApp();
  const myCropList = profile.myCrops.map((id) => findCrop(id));

  return (
    <div className="space-y-3">
      {showBanner && (
        <InfoBanner
          icon={<span className="text-base leading-none">🌱</span>}
          message="내가 재배하거나 관리하는 작물의 시세를 빠르게 확인하고 알림을 설정할 수 있습니다."
          onClose={onCloseBanner}
        />
      )}

      <div className="flex items-center justify-between px-1">
        <h2 className="text-[13.5px] font-bold text-foreground">
          내 작물 <span className="ml-0.5">{myCropList.length}</span>
        </h2>
        <button className="text-[12px] font-semibold text-muted-foreground">편집</button>
      </div>

      {myCropList.length === 0 ? (
        <EmptyState
          message="아직 등록한 내 작물이 없어요."
          subMessage="내가 재배하거나 관리하는 작물을 등록하면 시세를 빠르게 확인할 수 있어요."
          buttonLabel="내 작물 추가"
          onAction={() => navigate("/crop/add")}
        />
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}>
          {myCropList.map((crop, idx) => {
            const setting = profile.cropSettings?.[crop.id];
            const mktId = setting?.marketId ?? "garak";
            const vrty = crop.varieties[0];
            const mkt = findMarket(mktId);
            const price = seedPrice(crop.id, mktId, vrty);
            const history = seedPriceHistory(crop.id, mktId, vrty, 7);
            const seed = (crop.id.charCodeAt(0) + mktId.charCodeAt(0)) % 11;
            const up = seed % 2 === 0;
            const pct = ((seed % 7) + 1) * (up ? 1 : -1);
            const volSeed = (crop.id.charCodeAt(0) * 3 + mktId.charCodeAt(0)) % 13;
            const volUp = volSeed % 2 === 0;
            const volPct = ((volSeed % 9) + 1) * 2.3 * (volUp ? 1 : -1);

            return (
              <div key={crop.id}>
                {idx > 0 && <div className="h-px bg-border mx-4" />}
                <button
                  onClick={() => {
                    setCrop(crop.id, vrty);
                    setMarket(mktId);
                    navigate("/market");
                  }}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-secondary/50 transition-colors min-h-[72px]"
                >
                  <div className="shrink-0 w-11 h-11 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl">
                    {crop.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {crop.name} <span className="text-muted-foreground font-medium">· {vrty}</span>
                    </p>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{mkt.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{crop.defaultUnitKg}kg 기준</p>
                  </div>
                  <PriceSparkline data={history} width={56} height={26} showMarker={false} className="w-14 h-7 shrink-0" />
                  <div className="shrink-0 flex flex-col items-end ml-1">
                    <span className="text-[14px] font-extrabold text-foreground leading-none">
                      {price.toLocaleString()}원
                    </span>
                    <span className={`text-[11px] font-bold mt-1 leading-none ${up ? "price-up" : "price-down"}`}>
                      {up ? "+" : ""}{pct.toFixed(1)}%
                    </span>
                    <span className={`text-[10.5px] font-semibold mt-1 leading-none ${volUp ? "price-up" : "price-down"}`}>
                      거래량 {volUp ? "+" : ""}{volPct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/notification-settings");
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="가격 알림"
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground ml-1"
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {myCropList.length > 0 && myCropList.length < 3 && (
        <button
          onClick={() => navigate("/crop/add")}
          className="w-full min-h-12 rounded-2xl border border-dashed text-[13px] font-bold flex items-center justify-center gap-1.5"
          style={{ borderColor: "hsl(150 55% 70%)", color: PRIMARY }}
        >
          <Plus className="w-4 h-4" /> 내 작물 추가
        </button>
      )}

      {/* 작물 관리 */}
      <div className="bg-white border border-border rounded-2xl p-4" style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}>
        <p className="text-[13px] font-bold text-foreground mb-3">작물 관리</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Bell className="w-5 h-5" />, label: "가격 알림\n설정", to: "/notification-settings" },
            { icon: <span className="text-lg leading-none">⚖️</span>, label: "기준 단량\n설정", to: "/mypage" },
            { icon: <Store className="w-5 h-5" />, label: "기준 시장\n설정", to: "/mypage" },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.to)}
              className="flex flex-col items-center justify-center gap-1.5 min-h-[72px] rounded-xl bg-secondary/60 active:bg-secondary"
              style={{ color: PRIMARY }}
            >
              {item.icon}
              <span className="text-[11px] font-semibold text-foreground text-center whitespace-pre-line leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ====== Interests Tab ======
const InterestsTab = ({ showBanner, onCloseBanner }: { showBanner: boolean; onCloseBanner: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, setCrop, setMarket, toggleInterestCrop } = useApp();
  const ids = profile.interestCrops ?? [];
  const interestCrops = ids.map((id) => findCrop(id));
  const recommendCrops = RECOMMEND_IDS.filter((id) => !ids.includes(id)).map((id) => findCrop(id));

  return (
    <div className="space-y-3">
      {showBanner && (
        <InfoBanner
          icon={<Bookmark className="w-3.5 h-3.5" fill="currentColor" />}
          message="자주 보는 품목을 관심 품목으로 등록하면 홈과 시세 화면에서 빠르게 확인할 수 있습니다."
          onClose={onCloseBanner}
        />
      )}

      <div className="flex items-center justify-between px-1">
        <h2 className="text-[13.5px] font-bold text-foreground">
          관심 품목 <span className="ml-0.5">{interestCrops.length}</span>
        </h2>
        <button className="text-[12px] font-semibold text-muted-foreground">편집</button>
      </div>

      {interestCrops.length === 0 ? (
        <EmptyState
          message="관심 품목이 없어요."
          subMessage="자주 보는 품목을 저장해두면 홈과 시세에서 빠르게 확인할 수 있어요."
          buttonLabel="관심 품목 추가"
          onAction={() => navigate("/search")}
        />
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}>
          {interestCrops.map((crop, idx) => {
            const mktId = "garak";
            const vrty = crop.varieties[0];
            const mkt = findMarket(mktId);
            const price = seedPrice(crop.id, mktId, vrty);
            const history = seedPriceHistory(crop.id, mktId, vrty, 7);
            const seed = (crop.id.charCodeAt(0) + mktId.charCodeAt(0)) % 11;
            const up = seed % 2 === 0;
            const pct = ((seed % 7) + 1) * (up ? 1 : -1);
            const volSeed = (crop.id.charCodeAt(0) * 3 + mktId.charCodeAt(0)) % 13;
            const volUp = volSeed % 2 === 0;
            const volPct = ((volSeed % 9) + 1) * 2.3 * (volUp ? 1 : -1);

            return (
              <div key={crop.id}>
                {idx > 0 && <div className="h-px bg-border mx-4" />}
                <button
                  onClick={() => {
                    setCrop(crop.id, vrty);
                    setMarket(mktId);
                    navigate("/market");
                  }}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-secondary/50 transition-colors min-h-[76px]"
                >
                  <div className="shrink-0 w-11 h-11 rounded-full bg-[#F6F7F5] flex items-center justify-center text-xl">
                    {crop.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{crop.name}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{mkt.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{crop.defaultUnitKg}kg 기준</p>
                  </div>
                  <PriceSparkline data={history} width={56} height={26} showMarker={false} className="w-14 h-7 shrink-0" />
                  <div className="shrink-0 flex flex-col items-end ml-1">
                    <span className="text-[14px] font-extrabold text-foreground leading-none">
                      {price.toLocaleString()}원
                    </span>
                    <span className={`text-[11px] font-bold mt-1 leading-none ${up ? "price-up" : "price-down"}`}>
                      {up ? "+" : ""}{pct.toFixed(1)}%
                    </span>
                    <span className={`text-[10.5px] font-semibold mt-1 leading-none ${volUp ? "price-up" : "price-down"}`}>
                      거래량 {volUp ? "+" : ""}{volPct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="관심 해제"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleInterestCrop(crop.id);
                      toast({ description: "관심 품목에서 제거했어요" });
                    }}
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

      <button
        onClick={() => navigate("/search")}
        className="w-full min-h-12 rounded-2xl border border-dashed text-[13px] font-bold flex items-center justify-center gap-1.5"
        style={{ borderColor: "hsl(150 55% 70%)", color: PRIMARY }}
      >
        <Plus className="w-4 h-4" /> 관심 품목 추가
      </button>

      {recommendCrops.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[13px] font-bold text-foreground">추천 관심 품목</h3>
            <button onClick={() => navigate("/search")} className="text-[11.5px] font-semibold text-muted-foreground inline-flex items-center">
              더 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recommendCrops.slice(0, 6).map((crop) => (
              <button
                key={crop.id}
                onClick={() => {
                  toggleInterestCrop(crop.id);
                  toast({ description: `${crop.name}을(를) 관심 품목에 추가했어요` });
                }}
                className="inline-flex items-center gap-1.5 min-h-9 px-3.5 py-2 rounded-full bg-white border border-border text-[12px] font-semibold text-foreground"
                style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}
              >
                <span className="text-base leading-none">{crop.emoji}</span>
                {crop.name}
                <Plus className="w-3 h-3 ml-0.5" style={{ color: PRIMARY }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ====== Markets Tab ======
const MarketsTab = ({ showBanner, onCloseBanner }: { showBanner: boolean; onCloseBanner: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, setMarket, toggleFavMarket } = useApp();
  const ids = profile.favMarkets ?? [];
  const favMarkets = ids.map((id) => findMarket(id));
  const addableMarkets = MARKETS.filter((m) => !ids.includes(m.id));

  return (
    <div className="space-y-3">
      {showBanner && (
        <InfoBanner
          icon={<Store className="w-3.5 h-3.5" />}
          message="자주 보는 도매시장을 즐겨찾기하면 시장별 주요 품목 시세를 빠르게 확인할 수 있습니다."
          onClose={onCloseBanner}
        />
      )}

      <div className="flex items-center justify-between px-1">
        <h2 className="text-[13.5px] font-bold text-foreground">
          즐겨찾기 시장 <span className="ml-0.5">{favMarkets.length}</span>
        </h2>
        <button className="text-[12px] font-semibold text-muted-foreground">편집</button>
      </div>

      {favMarkets.length === 0 ? (
        <EmptyState
          message="즐겨찾기한 시장이 없어요."
          subMessage="자주 보는 도매시장을 저장해두면 시장별 시세를 빠르게 볼 수 있어요."
          buttonLabel="아래 시장에서 추가"
          onAction={() => {
            const el = document.getElementById("market-add-list");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      ) : (
        <div className="space-y-3">
          {favMarkets.map((market) => {
            const mainCropIds = MARKET_MAIN_CROPS[market.id] ?? ["cabbage", "onion", "tomato"];
            const mainCrops = mainCropIds.map((cid) => {
              const c = findCrop(cid);
              const p = seedPrice(cid, market.id, c.varieties[0]);
              const seed = (cid.charCodeAt(0) + market.id.charCodeAt(0)) % 11;
              const u = seed % 2 === 0;
              const pct = ((seed % 7) + 1) * (u ? 1 : -1);
              return { crop: c, price: p, pct, isUp: u };
            });

            return (
              <div
                key={market.id}
                className="bg-white border border-border rounded-2xl p-3.5"
                style={{ boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#F0F4EE] flex items-center justify-center text-2xl">
                    🏪
                  </div>
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
                      <span
                        className="text-[10.5px] font-semibold px-1.5 py-[2px] rounded-md"
                        style={{ color: PRIMARY, background: LIGHT_GREEN_BG }}
                      >
                        경매 진행중
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      toggleFavMarket(market.id);
                      toast({ description: "즐겨찾기에서 제거했어요" });
                    }}
                    aria-label="즐겨찾기 해제"
                    className="shrink-0 w-8 h-8 flex items-center justify-center"
                    style={{ color: PRIMARY }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                      <polygon points="12 2.7 14.9 9 21.6 9.7 16.5 14.3 18 21 12 17.5 6 21 7.5 14.3 2.4 9.7 9.1 9" />
                    </svg>
                  </button>
                </div>

                <div className="h-px bg-border my-3" />

                <div className="grid grid-cols-3 gap-2">
                  {mainCrops.map(({ crop, price, pct, isUp }) => (
                    <div key={crop.id} className="text-left">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 truncate">
                        <span className="text-sm leading-none">{crop.emoji}</span>
                        <span className="truncate">{crop.name}</span>
                      </p>
                      <p className="text-[13px] font-extrabold text-foreground mt-1">
                        {price.toLocaleString()}원
                      </p>
                      <p className={`text-[10.5px] font-bold mt-0.5 ${isUp ? "price-up" : "price-down"}`}>
                        {isUp ? "+" : ""}{pct.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setMarket(market.id);
                    navigate("/market");
                  }}
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

      {/* 추가 가능한 시장 */}
      {addableMarkets.length > 0 && (
        <div id="market-add-list" className="space-y-2 pt-1">
          <h3 className="text-[13px] font-bold text-foreground px-1">시장 추가</h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            {addableMarkets.map((m, i) => (
              <div key={m.id}>
                {i > 0 && <div className="h-px bg-border mx-4" />}
                <div className="flex items-center px-4 py-3 min-h-12">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                      <polygon points="12 2.7 14.9 9 21.6 9.7 16.5 14.3 18 21 12 17.5 6 21 7.5 14.3 2.4 9.7 9.1 9" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ====== Page ======
const Watchlist = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WatchTab>("myCrops");
  const [showMyCropsBanner, setShowMyCropsBanner] = useState(true);
  const [showInterestBanner, setShowInterestBanner] = useState(true);
  const [showMarketBanner, setShowMarketBanner] = useState(true);

  const handlePlusClick = () => {
    if (activeTab === "myCrops") navigate("/crop/add");
    else if (activeTab === "interests") navigate("/search");
    else {
      const el = document.getElementById("market-add-list");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="h-full bg-background">
      <AppHeader
        title="관심"
        rightAction={
          <button
            onClick={handlePlusClick}
            aria-label="추가"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ color: PRIMARY, background: LIGHT_GREEN_BG }}
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <main className="h-full overflow-y-auto px-4 pt-[calc(var(--app-header-height)+0.75rem)] pb-28 safe-bottom space-y-3">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="pt-1">
          {activeTab === "myCrops" && (
            <MyCropsTab showBanner={showMyCropsBanner} onCloseBanner={() => setShowMyCropsBanner(false)} />
          )}
          {activeTab === "interests" && (
            <InterestsTab showBanner={showInterestBanner} onCloseBanner={() => setShowInterestBanner(false)} />
          )}
          {activeTab === "markets" && (
            <MarketsTab showBanner={showMarketBanner} onCloseBanner={() => setShowMarketBanner(false)} />
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Watchlist;
