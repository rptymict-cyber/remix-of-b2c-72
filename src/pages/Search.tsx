import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, Clock, ChevronRight, Store, TrendingUp } from "lucide-react";
import { CROPS, MARKETS, findCrop, findMarket, seedPrice } from "@/data/catalog";
import { useApp } from "@/store/appStore";
import BottomNav from "@/components/BottomNav";

const RECENT_KEY = "recentSearches";

const RECOMMEND_KEYWORDS = [
  { label: "배추 시세", emoji: "🥬" },
  { label: "양파 가격", emoji: "🧅" },
  { label: "토마토 도매가", emoji: "🍅" },
  { label: "사과 시장 비교", emoji: "🍎" },
  { label: "대파 평균가", emoji: "🌱" },
  { label: "고구마 거래량", emoji: "🍠" },
];

  const POPULAR_CROPS = ["cabbage", "onion", "tomato", "apple", "sweet_potato", "green_onion"];
  const RANK_CROPS = ["cabbage", "onion", "tomato", "apple", "green_onion"];

const SAMPLE_RECENT: string[] = [
  "배추 · 서울가락시장",
  "양파 · 대구북부시장",
  "대저토마토 · 부산엄궁시장",
  "사과 · 안양시장",
];

const highlight = (text: string, q: string) => {
  if (!q) return text;
  const i = text.indexOf(q);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
};

const fmtPrice = (n: number) => `${n.toLocaleString()}원`;

const SearchPage = () => {
  const navigate = useNavigate();
  const { setCrop, setMarket, marketId, variety, cropId } = useApp();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "crop" | "variety" | "market">("all");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      const clean = Array.isArray(r) ? r.filter((x): x is string => typeof x === "string") : [];
      if (clean.length === 0) {
        setRecent(SAMPLE_RECENT);
      } else {
        setRecent(clean);
      }
    } catch {
      setRecent(SAMPLE_RECENT);
    }
  }, []);

  const addToRecent = (q: string) => {
    if (!q.trim()) return;
    const filtered = recent.filter((it) => it !== q);
    const updated = [q, ...filtered].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecent(updated);
  };

  const removeRecent = (q: string) => {
    const next = recent.filter((r) => r !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecent(next);
  };

  const clearRecent = () => {
    localStorage.setItem(RECENT_KEY, "[]");
    setRecent([]);
  };

  const cropResults = useMemo(() => {
    if (!query) return [];
    return CROPS.filter(
      (c) => c.name.includes(query) || c.varieties.some((v) => v.includes(query)),
    );
  }, [query]);

  const varietyResults = useMemo(() => {
    if (!query) return [] as { cropId: string; cropName: string; cropEmoji: string; variety: string }[];
    const out: { cropId: string; cropName: string; cropEmoji: string; variety: string }[] = [];
    CROPS.forEach((c) =>
      c.varieties.forEach((v) => {
        if (v.includes(query)) {
          out.push({ cropId: c.id, cropName: c.name, cropEmoji: c.emoji, variety: v });
        }
      }),
    );
    return out;
  }, [query]);

  const marketResults = useMemo(() => {
    if (!query) return [];
    return MARKETS.filter((m) => m.name.includes(query) || m.region.includes(query));
  }, [query]);

  const totalCount = cropResults.length + varietyResults.length + marketResults.length;
  const isInitial = query.length === 0;
  const hasResults = query.length > 0 && totalCount > 0;
  const isEmpty = query.length > 0 && totalCount === 0;

  const goCrop = (id: string, v?: string, label?: string) => {
    const c = findCrop(id);
    setCrop(id, v ?? c.varieties[0]);
    addToRecent(label ?? query ?? c.name);
    navigate("/market");
  };

  const goMarket = (id: string) => {
    setMarket(id);
    addToRecent(query || findMarket(id).name);
    navigate("/market");
  };

  const goRecent = (label: string) => {
    const [cropPart, marketPart] = label.split("·").map((s) => s.trim());
    if (cropPart) {
      const c = CROPS.find((x) => cropPart.includes(x.name));
      if (c) setCrop(c.id, c.varieties[0]);
    }
    if (marketPart) {
      const m = MARKETS.find((x) => marketPart.includes(x.name.replace(/\s/g, "")) || x.name.includes(marketPart));
      if (m) setMarket(m.id);
    }
    navigate("/market");
  };

  const showCrop = activeTab === "all" || activeTab === "crop";
  const showVariety = activeTab === "all" || activeTab === "variety";
  const showMarket = activeTab === "all" || activeTab === "market";

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-20 bg-white border-b border-border flex items-center gap-2"
        style={{ padding: "12px 10px 12px 4px" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="shrink-0 flex items-center justify-center text-foreground"
          style={{ width: 40, height: 40 }}
          aria-label="뒤로가기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="relative flex-1">
          <SearchIcon
            className="absolute top-1/2 -translate-y-1/2 text-primary"
            style={{ left: 12, width: 18, height: 18 }}
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) addToRecent(query.trim());
            }}
            placeholder="작물, 품종, 시장 검색"
            className="w-full outline-none transition-colors"
            style={{
              height: 44,
              paddingLeft: 38,
              paddingRight: query ? 38 : 12,
              borderRadius: 12,
              background: "hsl(150 30% 96%)",
              border: "1.5px solid hsl(150 55% 38% / 0.25)",
              fontSize: 15,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(150 55% 38%)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(150 55% 38% / 0.25)")}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground"
              style={{ right: 8, width: 26, height: 26, borderRadius: 13, background: "hsl(150 20% 90%)" }}
              aria-label="입력 삭제"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-7 safe-bottom pb-24">
        {isInitial && (
          <>
            {/* 최근 검색 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-bold text-foreground">최근 검색</h2>
                {recent.length > 0 && (
                  <button onClick={clearRecent} className="text-[12px] text-muted-foreground">
                    전체 삭제
                  </button>
                )}
              </div>
              {recent.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">최근 검색어가 없어요</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {recent.slice(0, 6).map((r) => (
                    <div
                      key={r}
                      className="flex items-center gap-1.5"
                      style={{
                        background: "hsl(150 30% 96%)",
                        border: "1px solid hsl(150 30% 90%)",
                        borderRadius: 12,
                        padding: "9px 10px",
                        minHeight: 40,
                      }}
                    >
                      <Clock style={{ width: 13, height: 13 }} className="text-primary shrink-0" />
                      <button
                        onClick={() => goRecent(r)}
                        className="flex-1 text-left text-[12.5px] font-medium text-foreground truncate"
                      >
                        {r}
                      </button>
                      <button
                        onClick={() => removeRecent(r)}
                        className="text-muted-foreground shrink-0"
                        aria-label="삭제"
                      >
                        <X style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 추천 키워드 */}
            <section>
              <h2 className="text-[14px] font-bold text-foreground mb-3">추천 키워드</h2>
              <div className="flex flex-wrap gap-1.5">
                {RECOMMEND_KEYWORDS.map((k) => (
                  <button
                    key={k.label}
                    onClick={() => setQuery(k.label.split(" ")[0])}
                    className="flex items-center gap-1 bg-white"
                    style={{
                      border: "1px solid hsl(150 30% 88%)",
                      borderRadius: 18,
                      padding: "6px 12px",
                      height: 32,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "hsl(150 55% 22%)",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{k.emoji}</span>
                    <span>{k.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 인기 검색 품목 */}
            <section>
              <h2 className="text-[14px] font-bold text-foreground mb-3">인기 검색 품목</h2>
              <div className="grid grid-cols-3 gap-2">
                {POPULAR_CROPS.map((id) => {
                  const c = findCrop(id);
                  return (
                    <button
                      key={id}
                      onClick={() => goCrop(id, undefined, c.name)}
                      className="flex flex-col items-center justify-center bg-white"
                      style={{
                        border: "1px solid hsl(150 20% 92%)",
                        borderRadius: 14,
                        padding: "14px 8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        minHeight: 86,
                      }}
                    >
                      <div
                        className="flex items-center justify-center mb-1.5"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: "hsl(150 40% 95%)",
                          fontSize: 22,
                        }}
                      >
                        {c.emoji}
                      </div>
                      <p className="text-[13px] font-bold text-foreground">{c.name}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 자주 찾는 시장 */}
            <section>
              <h2 className="text-[14px] font-bold text-foreground mb-3">자주 찾는 시장</h2>
              <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
                {FAV_MARKETS.map((id) => {
                  const m = findMarket(id);
                  return (
                    <button
                      key={id}
                      onClick={() => goMarket(id)}
                      className="shrink-0 flex items-center gap-1.5 bg-white"
                      style={{
                        border: "1px solid hsl(150 25% 90%)",
                        borderRadius: 22,
                        padding: "8px 14px",
                        height: 38,
                      }}
                    >
                      <span
                        className="flex items-center justify-center"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          background: "hsl(150 40% 94%)",
                        }}
                      >
                        <Store style={{ width: 12, height: 12 }} className="text-primary" />
                      </span>
                      <span className="text-[13px] font-semibold text-foreground">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 지금 많이 찾는 품목 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[14px] font-bold text-foreground">지금 많이 찾는 품목</h2>
                <span
                  className="font-bold"
                  style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: "hsl(150 40% 94%)",
                    color: "hsl(150 55% 30%)",
                  }}
                >
                  오늘 기준
                </span>
              </div>
              <div
                className="bg-white"
                style={{
                  border: "1px solid hsl(150 20% 92%)",
                  borderRadius: 14,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  overflow: "hidden",
                }}
              >
                {RANK_CROPS.map((id, i) => {
                  const c = findCrop(id);
                  return (
                    <button
                      key={id}
                      onClick={() => goCrop(id, undefined, c.name)}
                      className="w-full flex items-center gap-3 text-left"
                      style={{
                        padding: "12px 14px",
                        borderTop: i === 0 ? "none" : "1px solid hsl(150 20% 94%)",
                        minHeight: 52,
                      }}
                    >
                      <span
                        className="font-bold shrink-0 text-center"
                        style={{
                          width: 20,
                          fontSize: 14,
                          color: i < 3 ? "hsl(150 55% 30%)" : "hsl(220 8% 55%)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: "hsl(150 40% 95%)",
                          fontSize: 18,
                        }}
                      >
                        {c.emoji}
                      </span>
                      <span className="flex-1 text-[14px] font-semibold text-foreground">{c.name}</span>
                      {i === 0 && (
                        <TrendingUp style={{ width: 14, height: 14 }} className="text-primary" />
                      )}
                      <ChevronRight style={{ width: 16, height: 16 }} className="text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {hasResults && (
          <>
            {/* Tabs */}
            <div className="flex gap-1.5 mb-3">
              {[
                { k: "all", l: `전체 (${totalCount})` },
                { k: "crop", l: `작물 (${cropResults.length})` },
                { k: "variety", l: `품종 (${varietyResults.length})` },
                { k: "market", l: `시장 (${marketResults.length})` },
              ].map((t) => {
                const active = activeTab === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setActiveTab(t.k as typeof activeTab)}
                    className="font-semibold transition-colors"
                    style={{
                      fontSize: 12,
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 16,
                      background: active ? "#1A3A1F" : "#F5F5F5",
                      color: active ? "#fff" : "hsl(220 8% 55%)",
                    }}
                  >
                    {t.l}
                  </button>
                );
              })}
            </div>

            {showCrop && cropResults.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-[11px] font-bold text-muted-foreground">작물</h3>
                {cropResults.map((c) => {
                  const price = seedPrice(c.id, marketId, c.varieties[0]);
                  return (
                    <button
                      key={c.id}
                      onClick={() => goCrop(c.id)}
                      className="w-full min-h-11 flex items-center gap-2.5 bg-card text-left"
                      style={{
                        padding: "11px 13px",
                        borderRadius: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        className="shrink-0 flex items-center justify-center"
                        style={{ width: 38, height: 38, borderRadius: 12, background: "hsl(150 55% 94%)", fontSize: 20 }}
                      >
                        {c.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {highlight(c.name, query)}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {c.varieties.slice(0, 3).join(", ")} · {c.defaultUnitKg}kg 기준
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-foreground">{fmtPrice(price)}</p>
                        <p className="text-[11px] font-bold" style={{ color: "hsl(0 72% 51%)" }}>+2.3%</p>
                      </div>
                      <span
                        className="font-bold shrink-0"
                        style={{ fontSize: 10, padding: "2px 7px", borderRadius: 7, background: "hsl(150 55% 94%)", color: "hsl(150 55% 38%)" }}
                      >
                        작물
                      </span>
                    </button>
                  );
                })}
              </section>
            )}

            {showVariety && varietyResults.length > 0 && (
              <section className="space-y-2 mt-4">
                <h3 className="text-[11px] font-bold text-muted-foreground">품종</h3>
                {varietyResults.map((v, i) => {
                  const price = seedPrice(v.cropId, marketId, v.variety);
                  return (
                    <button
                      key={i}
                      onClick={() => goCrop(v.cropId, v.variety)}
                      className="w-full min-h-11 flex items-center gap-2.5 bg-card text-left"
                      style={{ padding: "11px 13px", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    >
                      <div
                        className="shrink-0 flex items-center justify-center"
                        style={{ width: 38, height: 38, borderRadius: 12, background: "hsl(30 90% 94%)", fontSize: 20 }}
                      >
                        {v.cropEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {v.cropName} {highlight(v.variety, query)}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          품종 · {findMarket(marketId).name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-foreground">{fmtPrice(price)}</p>
                        <p className="text-[11px] font-bold" style={{ color: "hsl(0 72% 51%)" }}>+1.8%</p>
                      </div>
                      <span
                        className="font-bold shrink-0"
                        style={{ fontSize: 10, padding: "2px 7px", borderRadius: 7, background: "hsl(30 90% 94%)", color: "hsl(30 72% 41%)" }}
                      >
                        품종
                      </span>
                    </button>
                  );
                })}
              </section>
            )}

            {showMarket && marketResults.length > 0 && (
              <section className="space-y-2 mt-4">
                <h3 className="text-[11px] font-bold text-muted-foreground">시장</h3>
                {marketResults.map((m) => {
                  const price = seedPrice(cropId || "pepper", m.id, variety);
                  const vol = 1200 + (m.id.charCodeAt(0) % 9) * 130;
                  return (
                    <button
                      key={m.id}
                      onClick={() => goMarket(m.id)}
                      className="w-full min-h-11 flex items-center gap-2.5 bg-card text-left"
                      style={{ padding: "11px 13px", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    >
                      <div
                        className="shrink-0 flex items-center justify-center"
                        style={{ width: 38, height: 38, borderRadius: 12, background: "hsl(220 80% 94%)", fontSize: 20 }}
                      >
                        🏪
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {highlight(m.name, query)}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          거래량 {vol.toLocaleString()}t · {m.region}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-foreground">{fmtPrice(price)}</p>
                      </div>
                      <span
                        className="font-bold shrink-0"
                        style={{ fontSize: 10, padding: "2px 7px", borderRadius: 7, background: "hsl(220 80% 94%)", color: "hsl(220 72% 41%)" }}
                      >
                        시장
                      </span>
                    </button>
                  );
                })}
              </section>
            )}
          </>
        )}

        {isEmpty && (
          <div className="text-center" style={{ padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p className="text-[15px] font-bold text-foreground">검색 결과가 없습니다.</p>
            <p className="text-[13px] text-muted-foreground mt-2">다시 검색해 보세요.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default SearchPage;
