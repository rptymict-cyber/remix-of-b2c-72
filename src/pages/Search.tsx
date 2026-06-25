import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, X, Clock, Store, Sprout, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { CROPS, MARKETS, findCrop, findMarket } from "@/data/catalog";


const RECENT_KEY = "recentSearches";

interface RecentItem {
  cropId?: string;
  variety?: string;
  marketId?: string;
  label: string;
}

const loadRecent = (): RecentItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveRecent = (items: RecentItem[]) => {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 8)));
};

const RECOMMEND_CROPS = ["cabbage", "onion", "tomato", "sweet_potato", "radish", "green_onion", "apple", "pepper"];
const RECOMMEND_MARKETS = ["garak", "daegu", "busan", "gangseo", "gwangju", "suwon"];

const SearchPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [sel, setSel] = useState<{ cropId?: string; variety?: string; marketId?: string }>({});

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const query = q.trim();

  const cropMatches = useMemo(() => {
    if (!query) return [];
    return CROPS.filter((c) => c.name.includes(query) || c.varieties.some((v) => v.includes(query))).slice(0, 6);
  }, [query]);

  const varietyMatches = useMemo(() => {
    if (!query) return [];
    const out: { cropId: string; variety: string }[] = [];
    CROPS.forEach((c) =>
      c.varieties.forEach((v) => {
        if (v.includes(query) || query.includes(c.name)) out.push({ cropId: c.id, variety: v });
      }),
    );
    return out.slice(0, 8);
  }, [query]);

  const marketMatches = useMemo(() => {
    if (!query) return [];
    return MARKETS.filter((m) => m.name.includes(query) || m.region.includes(query)).slice(0, 6);
  }, [query]);

  const comboMatches = useMemo(() => {
    if (!query || cropMatches.length === 0) return [];
    const crop = cropMatches[0];
    return MARKETS.slice(0, 3).map((m) => ({ cropId: crop.id, marketId: m.id }));
  }, [query, cropMatches]);

  const hasResults =
    cropMatches.length + varietyMatches.length + marketMatches.length + comboMatches.length > 0;

  const labelOf = (s: { cropId?: string; variety?: string; marketId?: string }) => {
    const parts: string[] = [];
    if (s.cropId) {
      const c = findCrop(s.cropId);
      parts.push(`${c.emoji} ${c.name}${s.variety ? ` · ${s.variety}` : ""}`);
    }
    if (s.marketId) parts.push(findMarket(s.marketId).name);
    return parts.join(" · ");
  };

  const goSearch = (s: { cropId?: string; variety?: string; marketId?: string }) => {
    if (!s.cropId && !s.marketId) return;
    const label = labelOf(s);
    const next = [{ ...s, label }, ...recent.filter((r) => r.label !== label)];
    saveRecent(next);
    const params = new URLSearchParams();
    if (s.cropId) params.set("crop", s.cropId);
    if (s.variety) params.set("variety", s.variety);
    if (s.marketId) params.set("market", s.marketId);
    navigate(`/market?${params.toString()}`);
  };

  const pickCrop = (cropId: string, variety?: string) => {
    setSel((p) => ({ ...p, cropId, variety }));
  };
  const pickMarket = (marketId: string) => {
    setSel((p) => ({ ...p, marketId }));
  };

  const selReady = Boolean(sel.cropId || sel.marketId);

  return (
    <div className="h-full bg-background flex flex-col">
      {/* 상단 검색바 */}
      <header className="sticky top-0 z-30 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-3 h-14">
          <button onClick={() => navigate(-1)} aria-label="뒤로" className="p-2 -ml-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-2xl bg-secondary">
            <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="품목, 품종, 시장을 검색하세요"
              className="flex-1 bg-transparent text-[14px] placeholder:text-muted-foreground outline-none"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="지우기" className="p-1 -mr-1 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {selReady && (
          <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">선택 조건</span>
            <span className="text-[12px] font-semibold px-2 py-1 rounded-full bg-[#EAF7EA] text-[#1A3A1F]">
              {labelOf(sel) || "—"}
            </span>
            <button
              onClick={() => setSel({})}
              className="text-[11px] text-muted-foreground underline ml-auto"
            >
              초기화
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-6 safe-bottom" style={{ paddingBottom: selReady ? 168 : 96 }}>
        {!query ? (
          <>
            {/* 최근 검색 */}
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-2">최근 검색</h2>
              {recent.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">최근 검색 내역이 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recent.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => goSearch(r)}
                      className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-card border border-border text-[12.5px] font-medium text-foreground"
                    >
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 추천 품목 */}
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-2">추천 품목</h2>
              <div className="grid grid-cols-4 gap-2">
                {RECOMMEND_CROPS.map((id) => {
                  const c = findCrop(id);
                  return (
                    <button
                      key={id}
                      onClick={() => pickCrop(id)}
                      className={`min-h-[72px] rounded-2xl border flex flex-col items-center justify-center gap-1 p-2 ${
                        sel.cropId === id ? "border-primary bg-primary/5" : "border-border bg-card"
                      }`}
                    >
                      <span className="text-2xl leading-none">{c.emoji}</span>
                      <span className="text-[12px] font-semibold text-foreground">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 시장 */}
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-2">시장</h2>
              <div className="space-y-1.5">
                {RECOMMEND_MARKETS.map((id) => {
                  const m = findMarket(id);
                  return (
                    <button
                      key={id}
                      onClick={() => pickMarket(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                        sel.marketId === id ? "border-primary bg-primary/5" : "border-border bg-card"
                      }`}
                    >
                      <Store className="w-4 h-4 text-primary shrink-0" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.region}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <>
            {!hasResults && (
              <p className="text-[13px] text-muted-foreground text-center py-12">
                "{query}"에 대한 검색 결과가 없습니다.
              </p>
            )}

            {cropMatches.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground mb-2">품목</h3>
                <div className="space-y-1.5">
                  {cropMatches.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => goSearch({ cropId: c.id })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border"
                    >
                      <span className="text-xl">{c.emoji}</span>
                      <span className="text-[13px] font-bold text-foreground flex-1 text-left">{c.name}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {varietyMatches.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground mb-2">품종</h3>
                <div className="space-y-1.5">
                  {varietyMatches.map((v, i) => {
                    const c = findCrop(v.cropId);
                    return (
                      <button
                        key={i}
                        onClick={() => goSearch({ cropId: v.cropId, variety: v.variety })}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border"
                      >
                        <Sprout className="w-4 h-4 text-primary" />
                        <span className="text-[13px] text-foreground flex-1 text-left">
                          {c.name} · <span className="font-bold">{v.variety}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {marketMatches.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground mb-2">시장</h3>
                <div className="space-y-1.5">
                  {marketMatches.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => goSearch({ marketId: m.id })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border"
                    >
                      <Store className="w-4 h-4 text-primary" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.region}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {comboMatches.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground mb-2">추천 조건</h3>
                <div className="space-y-1.5">
                  {comboMatches.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => goSearch(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border"
                    >
                      <span className="text-base">{findCrop(c.cropId).emoji}</span>
                      <span className="text-[13px] text-foreground flex-1 text-left">
                        <span className="font-bold">{findCrop(c.cropId).name}</span>
                        <span className="text-muted-foreground"> · {findMarket(c.marketId).name}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {selReady && (
        <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border p-3 z-[90]">
          <button
            onClick={() => goSearch(sel)}
            className="w-full h-12 rounded-2xl bg-[#1A3A1F] text-white text-[14px] font-bold"
          >
            이 조건으로 시세 조회하기
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  );
};

export default SearchPage;

