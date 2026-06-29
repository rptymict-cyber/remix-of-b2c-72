import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, Bookmark, BarChart3, Sprout, Trash2, ChevronRight, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/appStore";
import { findCrop, findMarket, MARKETS, seedPrice, seedPriceHistory } from "@/data/catalog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PRIMARY = "hsl(150 55% 38%)";
const LIGHT_BG = "hsl(150 55% 94%)";

const InterestCropDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const profile = useApp((s) => s.profile);
  const notif = useApp((s) => s.notif);
  const setCrop = useApp((s) => s.setCrop);
  const setMarket = useApp((s) => s.setMarket);
  const setCropSetting = useApp((s) => s.setCropSetting);
  const toggleInterestCrop = useApp((s) => s.toggleInterestCrop);
  const removeMyCrop = useApp((s) => s.removeMyCrop);
  const addMyCrop = useApp((s) => s.addMyCrop);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const isInInterest = (profile.interestCrops ?? []).includes(id);
  const isInMyCrops = profile.myCrops.includes(id);
  const exists = isInInterest || isInMyCrops;

  const crop = findCrop(id);
  const setting = profile.cropSettings?.[id];
  const marketId = setting?.marketId || "garak";
  const market = findMarket(marketId);
  const variety = setting?.selectedVarieties?.[0] || crop.varieties[0] || "";

  const price = seedPrice(crop.id, marketId, variety);
  const history = useMemo(() => seedPriceHistory(crop.id, marketId, variety, 7), [crop.id, marketId, variety]);
  const chartData = history.map((v, i) => ({ d: `D-${6 - i}`, price: v }));
  const hi = Math.max(...history);
  const lo = Math.min(...history);
  const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
  const dPct = history.length >= 2 ? ((history[history.length - 1] - history[history.length - 2]) / history[history.length - 2]) * 100 : 0;
  const up = dPct >= 0;

  if (!id || crop.id === "__unknown__" || !exists) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader title="관심 품목" variant="back" />
        <main className="pt-[88px] pb-24 px-4 flex-1 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">❓</div>
          <p className="text-[15px] font-bold text-foreground">관심 품목을 찾을 수 없습니다</p>
          <p className="text-[12.5px] text-muted-foreground">목록에서 다시 선택해 주세요.</p>
          <button
            onClick={() => navigate("/watchlist")}
            className="mt-2 h-11 px-5 rounded-xl text-white text-[13px] font-bold"
            style={{ background: PRIMARY }}
          >
            관심 목록으로 이동
          </button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const goPrices = () => {
    setCrop(crop.id, variety);
    setMarket(marketId);
    navigate(`/market?cropId=${crop.id}&marketId=${marketId}`);
  };

  const convertToGrowing = () => {
    if (!isInMyCrops) addMyCrop(crop.id);
    setCropSetting(crop.id, { regType: "growing", region: setting?.region || profile.region, marketId });
    if (isInInterest) toggleInterestCrop(crop.id);
    toast.success("재배 작물로 전환됐어요");
    navigate(`/crop-settings/${crop.id}`);
  };

  const handleDelete = () => {
    if (isInInterest) toggleInterestCrop(crop.id);
    if (isInMyCrops && setting?.regType === "interest") removeMyCrop(crop.id);
    toast("관심 품목에서 제거했어요");
    navigate(-1);
  };

  // 시장별 가격 비교
  const compareMarkets = MARKETS.slice(0, 4).map((m) => {
    const p = seedPrice(crop.id, m.id, variety);
    const seed = (crop.id.charCodeAt(0) + m.id.charCodeAt(0)) % 11;
    const pct = ((seed % 7) + 1) * (seed % 2 === 0 ? 1 : -1);
    const vol = 100 + ((seed * 13) % 80);
    return { ...m, p, pct, vol, isCurrent: m.id === marketId };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        title="관심 품목"
        subtitle={crop.name}
        variant="back"
        rightAction={
          <button
            onClick={() => navigate("/notification-settings")}
            aria-label="알림 설정"
            className="text-foreground"
          >
            <Bell className="w-5 h-5" />
          </button>
        }
      />

      <main className="pt-[72px] pb-28 px-4 space-y-3 flex-1 overflow-y-auto">
        {/* Hero */}
        <section className="bg-white border border-border rounded-2xl p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F6F7F5] flex items-center justify-center text-3xl shrink-0">
              {crop.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[16px] font-extrabold text-foreground truncate">{crop.name}</p>
                <span
                  className="text-[10.5px] font-semibold px-2 py-[2px] rounded-md inline-flex items-center gap-1"
                  style={{ color: PRIMARY, background: LIGHT_BG }}
                >
                  <Bookmark className="w-3 h-3" fill="currentColor" /> 관심 품목
                </span>
              </div>
              <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                {market.name} · {variety || "전체 품종"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">현재가 / {crop.defaultUnitKg}kg</p>
              <p className="text-[22px] font-extrabold text-foreground leading-tight">{price.toLocaleString()}원</p>
            </div>
            <div className="text-right">
              <p className={`text-[13px] font-bold ${up ? "price-up" : "price-down"}`}>
                전일 대비 {up ? "+" : ""}{dPct.toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">거래량 정상</p>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground leading-relaxed">
            시세 흐름을 관찰 중입니다. 재배 작물로 전환하면 AI 출하 추천과 판매처 비교를 사용할 수 있어요.
          </p>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-3 gap-2">
          <button
            onClick={goPrices}
            className="bg-white border border-border rounded-2xl py-3 flex flex-col items-center gap-1 active:scale-[0.98] transition-transform"
          >
            <BarChart3 className="w-5 h-5" style={{ color: PRIMARY }} />
            <span className="text-[11.5px] font-bold text-foreground">시세 자세히</span>
          </button>
          <button
            onClick={() => navigate("/notification-settings")}
            className="bg-white border border-border rounded-2xl py-3 flex flex-col items-center gap-1 active:scale-[0.98] transition-transform"
          >
            <Bell className="w-5 h-5" style={{ color: PRIMARY }} />
            <span className="text-[11.5px] font-bold text-foreground">가격 알림</span>
          </button>
          <button
            onClick={convertToGrowing}
            className="rounded-2xl py-3 flex flex-col items-center gap-1 text-white active:scale-[0.98] transition-transform"
            style={{ background: PRIMARY }}
          >
            <Sprout className="w-5 h-5" />
            <span className="text-[11.5px] font-bold">재배 전환</span>
          </button>
        </section>

        {/* Mini chart */}
        <section className="bg-white border border-border rounded-2xl p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13.5px] font-bold text-foreground">최근 7일 시세</h3>
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 일별 추이
            </span>
          </div>
          <div className="h-32 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(0 0% 92%)" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "hsl(0 0% 50%)" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString()}원`, "가격"]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="price" stroke={PRIMARY} strokeWidth={2.2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 mt-2 pt-2 border-t border-border">
            <div className="text-center">
              <p className="text-[10.5px] text-muted-foreground">최고가</p>
              <p className="text-[12.5px] font-bold text-foreground">{hi.toLocaleString()}원</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-[10.5px] text-muted-foreground">평균가</p>
              <p className="text-[12.5px] font-bold text-foreground">{avg.toLocaleString()}원</p>
            </div>
            <div className="text-center">
              <p className="text-[10.5px] text-muted-foreground">최저가</p>
              <p className="text-[12.5px] font-bold text-foreground">{lo.toLocaleString()}원</p>
            </div>
          </div>
        </section>

        {/* Market comparison */}
        <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <h3 className="text-[13.5px] font-bold text-foreground">시장별 가격 비교</h3>
            <span className="text-[10.5px] text-muted-foreground">{crop.defaultUnitKg}kg 기준</span>
          </div>
          {compareMarkets.map((m, idx) => {
            const mUp = m.pct >= 0;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setCropSetting(crop.id, { marketId: m.id });
                  setMarket(m.id);
                  toast(`${m.name} 기준으로 변경했어요`);
                }}
                className={`w-full flex items-center px-4 py-3 text-left active:bg-secondary/40 ${
                  idx > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">
                    {m.name}
                    {m.isCurrent && (
                      <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-[1px] rounded" style={{ color: PRIMARY, background: LIGHT_BG }}>
                        기준
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">거래량 {m.vol}t</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-extrabold text-foreground leading-none">{m.p.toLocaleString()}원</p>
                  <p className={`text-[11px] font-bold mt-1 leading-none ${mUp ? "price-up" : "price-down"}`}>
                    {mUp ? "+" : ""}{m.pct.toFixed(1)}%
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        {/* Notification status */}
        <section className="bg-white border border-border rounded-2xl p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[13.5px] font-bold text-foreground">알림 상태</h3>
            <button
              onClick={() => navigate("/notification-settings")}
              className="text-[11.5px] font-semibold inline-flex items-center"
              style={{ color: PRIMARY }}
            >
              설정 변경 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <ul className="space-y-1.5 text-[12.5px]">
            <li className="flex items-center justify-between">
              <span className="text-foreground">가격 급등락 알림</span>
              <span className="font-bold" style={{ color: notif.priceAlert ? PRIMARY : "hsl(0 0% 60%)" }}>
                {notif.priceAlert ? `ON · ±${notif.priceThreshold}%` : "OFF"}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-foreground">시장 휴무 알림</span>
              <span className="font-bold" style={{ color: notif.marketHoliday ? PRIMARY : "hsl(0 0% 60%)" }}>
                {notif.marketHoliday ? "ON" : "OFF"}
              </span>
            </li>
          </ul>
        </section>

        {/* Convert CTA */}
        <section
          className="rounded-2xl p-4 border"
          style={{ background: LIGHT_BG, borderColor: "hsl(150 55% 80%)" }}
        >
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" style={{ color: PRIMARY }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground">이 품목을 실제로 재배 중인가요?</p>
              <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
                재배 작물로 전환하면 AI 출하일 추천, 판매처 추천, 물류비 기반 순이익 비교를 사용할 수 있습니다.
              </p>
              <button
                onClick={convertToGrowing}
                className="mt-2.5 h-10 px-4 rounded-xl text-white text-[12.5px] font-bold"
                style={{ background: PRIMARY }}
              >
                재배 작물로 전환
              </button>
            </div>
          </div>
        </section>

        {/* Delete */}
        <section className="pt-2">
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full h-11 rounded-xl border border-border text-[12.5px] font-bold text-destructive inline-flex items-center justify-center gap-1.5 bg-white"
          >
            <Trash2 className="w-4 h-4" /> 관심 품목에서 삭제
          </button>
        </section>
      </main>

      <BottomNav />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>관심 품목에서 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {crop.name}을(를) 관심 목록에서 제거합니다. 언제든 다시 추가할 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InterestCropDetail;
