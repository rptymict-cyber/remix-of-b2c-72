import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { CROPS, MARKETS, findCrop, findMarket, seedPrice } from "@/data/catalog";
import { useApp } from "@/store/appStore";

interface SavedQuery {
  label: string;
  cropId: string;
  varietyId: string;
  marketId: string;
}

const RECENT_KEY = "recentSearches";
const SAVED_KEY = "savedQueries";

const HOT_CROPS = [
  { cropId: "cabbage", label: "🥬 배추", name: "배추", change: "+6.2%", up: true },
  { cropId: "onion", label: "🧅 양파", name: "양파", change: "+3.1%", up: true },
  { cropId: "sweet_potato", label: "🍠 고구마", name: "고구마", change: "+2.7%", up: true },
];

const QUICK_CROPS = [
  { id: "cabbage", change: "+6.2%", up: true },
  { id: "onion", change: "+3.1%", up: true },
  { id: "apple", change: "-1.4%", up: false },
  { id: "radish", change: "+2.0%", up: true },
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
  const { setCrop, setMarket, marketId, variety, cropId, profile } = useApp();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "crop" | "variety" | "market">("all");
  const [recent, setRecent] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedQuery[]>([]);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      const clean = Array.isArray(r) ? r.filter((x): x is string => typeof x === "string") : [];
      setRecent(clean);
      localStorage.setItem(RECENT_KEY, JSON.stringify(clean));
    } catch {
      setRecent([]);
    }
    try {
      const s = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      if (Array.isArray(s) && s.length > 0) {
        setSaved(s);
      } else {
        const seeded: SavedQuery[] = (profile.myCrops || []).slice(0, 3).map((id) => {
          const c = findCrop(id);
          const m = findMarket(marketId);
          return {
            label: `${c.name}·${m.name.replace("서울 ", "").replace("시장", "")}`,
            cropId: id,
            varietyId: c.varieties[0],
            marketId,
          };
        });
        setSaved(seeded);
      }
    } catch {
      setSaved([]);
    }
  }, [profile.myCrops, marketId]);

  const addToRecent = (q: string) => {
    if (!q.trim()) return;
    const existing = (() => {
      try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      } catch {
        return [];
      }
    })();
    const filtered = (Array.isArray(existing) ? existing : []).filter((it: string) => it !== q);
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

  const goSaved = (s: SavedQuery) => {
    setCrop(s.cropId, s.varietyId);
    setMarket(s.marketId);
    navigate("/market");
  };

  const goCrop = (id: string, v?: string) => {
    const c = findCrop(id);
    setCrop(id, v ?? c.varieties[0]);
    addToRecent(query || c.name);
    navigate("/market");
  };

  const goMarket = (id: string) => {
    setMarket(id);
    addToRecent(query || findMarket(id).name);
    navigate("/market");
  };

  const showCrop = activeTab === "all" || activeTab === "crop";
  const showVariety = activeTab === "all" || activeTab === "variety";
  const showMarket = activeTab === "all" || activeTab === "market";

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-20 bg-white border-b border-border flex items-center gap-2.5"
        style={{ padding: "12px 14px" }}
      >
        <div className="relative flex-1">
          <SearchIcon
            className="absolute top-1/2 -translate-y-1/2 text-primary"
            style={{ left: 10, width: 18, height: 18 }}
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="품목, 품종, 시장 검색"
            className="w-full outline-none transition-colors"
            style={{
              height: 42,
              paddingLeft: 36,
              paddingRight: 12,
              borderRadius: 12,
              background: "hsl(150 30% 96%)",
              border: "1.5px solid hsl(150 55% 38% / 0.25)",
              fontSize: 15,
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "hsl(150 55% 38%)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "hsl(150 55% 38% / 0.25)")
            }
          />
        </div>
        <button
          onClick={() => navigate(-1)}
          className="shrink-0 text-muted-foreground font-semibold"
          style={{ fontSize: 14 }}
        >
          취소
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6 safe-bottom pb-24">
        {isInitial && (
          <>
            {/* 즐겨찾기 */}
            {saved.length > 0 && (
              <section>
                <h2 className="text-[13px] font-bold text-foreground mb-2.5">⭐ 즐겨찾기</h2>
                <div className="space-y-2">
                  {saved.map((s, i) => {
                    const c = findCrop(s.cropId);
                    const m = findMarket(s.marketId);
                    const price = seedPrice(s.cropId, s.marketId, s.varietyId);
                    return (
                      <button
                        key={i}
                        onClick={() => goSaved(s)}
                        className="w-full flex items-center gap-2.5 bg-card text-left"
                        style={{
                          padding: "11px 13px",
                          borderRadius: 12,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div
                          className="shrink-0 flex items-center justify-center"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 11,
                            background: "hsl(150 55% 94%)",
                            fontSize: 18,
                          }}
                        >
                          {c.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-foreground truncate">{s.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {m.name} · {c.defaultUnitKg}kg
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-bold text-foreground">{fmtPrice(price)}</p>
                          <p className="text-[11px] font-bold" style={{ color: "hsl(0 72% 51%)" }}>
                            ▲ +2.7%
                          </p>
                        </div>
                        <span style={{ fontSize: 16, color: "hsl(40 90% 55%)" }}>★</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 최근 검색 */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[13px] font-bold text-foreground">최근 검색</h2>
                {recent.length > 0 && (
                  <button onClick={clearRecent} className="text-[12px] text-muted-foreground">
                    전체 삭제
                  </button>
                )}
              </div>
              {recent.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">최근 검색어가 없어요</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((r) => (
                    <div
                      key={r}
                      className="flex items-center gap-1.5 bg-white"
                      style={{
                        border: "1.5px solid hsl(220 13% 91%)",
                        borderRadius: 20,
                        padding: "6px 12px",
                        height: 32,
                      }}
                    >
                      <button
                        onClick={() => setQuery(r)}
                        className="text-[12px] font-medium text-foreground"
                      >
                        {r}
                      </button>
                      <button
                        onClick={() => removeRecent(r)}
                        className="text-[12px] text-muted-foreground leading-none"
                        aria-label="삭제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 지금 급등 중인 작물 */}
            <section>
              <h2 className="text-[13px] font-bold text-foreground mb-2.5">🔥 지금 급등 중인 작물</h2>
              <div className="flex flex-wrap gap-1.5">
                {HOT_CROPS.map((h) => (
                  <button
                    key={h.cropId}
                    onClick={() => setQuery(h.name)}
                    className="font-bold"
                    style={{
                      fontSize: 12,
                      borderRadius: 20,
                      padding: "6px 13px",
                      height: 32,
                      background: h.up ? "hsl(0 90% 95%)" : "hsl(220 80% 95%)",
                      color: h.up ? "hsl(0 72% 51%)" : "hsl(220 72% 51%)",
                    }}
                  >
                    {h.label} {h.change}
                  </button>
                ))}
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
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: "hsl(150 55% 94%)",
                          fontSize: 20,
                        }}
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
                        <p className="text-[11px] font-bold" style={{ color: "hsl(0 72% 51%)" }}>
                          +2.3%
                        </p>
                      </div>
                      <span
                        className="font-bold shrink-0"
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 7,
                          background: "hsl(150 55% 94%)",
                          color: "hsl(150 55% 38%)",
                        }}
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
                      style={{
                        padding: "11px 13px",
                        borderRadius: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        className="shrink-0 flex items-center justify-center"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: "hsl(30 90% 94%)",
                          fontSize: 20,
                        }}
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
                        <p className="text-[11px] font-bold" style={{ color: "hsl(0 72% 51%)" }}>
                          +1.8%
                        </p>
                      </div>
                      <span
                        className="font-bold shrink-0"
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 7,
                          background: "hsl(30 90% 94%)",
                          color: "hsl(30 72% 41%)",
                        }}
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
                      style={{
                        padding: "11px 13px",
                        borderRadius: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        className="shrink-0 flex items-center justify-center"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: "hsl(220 80% 94%)",
                          fontSize: 20,
                        }}
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
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 7,
                          background: "hsl(220 80% 94%)",
                          color: "hsl(220 72% 41%)",
                        }}
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
          <>
            <div className="text-center" style={{ padding: "40px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p className="text-[15px] font-bold text-foreground">
                "{query}" 검색 결과가 없어요
              </p>
              <p
                className="text-[13px] text-muted-foreground mt-2 whitespace-pre-line"
                style={{ lineHeight: 1.6 }}
              >
                {"현재 지원하지 않는 작물이에요.\n아래 주요 작물에서 찾아보세요."}
              </p>
            </div>
            <section>
              <h3 className="text-[13px] font-bold text-foreground mb-2.5">주요 작물 바로가기</h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_CROPS.map((q) => {
                  const c = findCrop(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => goCrop(q.id)}
                      className="flex items-center gap-2 bg-card"
                      style={{
                        padding: "11px 12px",
                        borderRadius: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{c.emoji}</span>
                      <div className="flex-1 text-left">
                        <p className="text-[13px] font-bold text-foreground">{c.name}</p>
                        <p
                          className="text-[11px] font-bold"
                          style={{
                            color: q.up ? "hsl(0 72% 51%)" : "hsl(220 72% 51%)",
                          }}
                        >
                          {q.up ? "▲" : "▼"} {q.change}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
