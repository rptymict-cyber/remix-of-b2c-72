import { useEffect, useMemo, useState } from "react";
import { Check, Search, Home, AlertTriangle } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

// 시·군·구 후보 (간단 데이터셋)
const REGION_DB: string[] = [
  "충청남도 공주시", "충청남도 천안시", "충청남도 논산시", "충청남도 부여군", "충청남도 서산시",
  "충청북도 청주시", "충청북도 충주시", "충청북도 제천시",
  "전라북도 김제시", "전라북도 전주시", "전라북도 익산시", "전라북도 정읍시", "전라북도 남원시",
  "전라남도 나주시", "전라남도 순천시", "전라남도 해남군", "전라남도 영암군",
  "경상북도 안동시", "경상북도 경주시", "경상북도 상주시", "경상북도 영천시", "경상북도 의성군",
  "경상남도 진주시", "경상남도 창원시", "경상남도 김해시",
  "경기도 안성시", "경기도 평택시", "경기도 이천시", "경기도 여주시",
  "강원특별자치도 춘천시", "강원특별자치도 원주시", "강원특별자치도 강릉시",
  "제주특별자치도 제주시", "제주특별자치도 서귀포시",
];

// 짧은 이름 변환
export const shortCity = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] || full;
};

// 표준 표기 변환 (저장된 "충남 공주시" → "충청남도 공주시")
const PROVINCE_MAP: Record<string, string> = {
  "충남": "충청남도", "충북": "충청북도",
  "전남": "전라남도", "전북": "전라북도",
  "경남": "경상남도", "경북": "경상북도",
  "강원": "강원특별자치도", "제주": "제주특별자치도",
};
const expandRegion = (s: string) => {
  const parts = s.trim().split(/\s+/);
  if (parts.length === 2 && PROVINCE_MAP[parts[0]]) return `${PROVINCE_MAP[parts[0]]} ${parts[1]}`;
  return s;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentRegion: string; // 온보딩에서 설정한 위치
  selectedRegion: string;
  recents?: string[];
  onConfirm: (region: string) => void;
}

const LocationSheet = ({ open, onOpenChange, currentRegion, selectedRegion, recents = [], onConfirm }: Props) => {
  const expandedCurrent = useMemo(() => expandRegion(currentRegion), [currentRegion]);
  const [draft, setDraft] = useState(selectedRegion);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(selectedRegion);
      setQ("");
    }
  }, [open, selectedRegion]);

  const results = useMemo(() => {
    const kw = q.trim();
    if (!kw) return [];
    return REGION_DB.filter((r) => r.includes(kw)).slice(0, 12);
  }, [q]);

  const recentList = useMemo(() => {
    const merged = [expandedCurrent, ...recents.map(expandRegion)];
    return Array.from(new Set(merged));
  }, [expandedCurrent, recents]);

  const disabled = draft === selectedRegion;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <div className="pt-2 pb-3">
          <h3 className="text-base font-bold text-foreground">내 출발 위치</h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            물류비 계산의 기준이 되는 농장 위치입니다.
          </p>
        </div>

        {/* 현재 설정 위치 */}
        <div className="rounded-2xl border-2 border-primary bg-primary/5 px-4 py-3 flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Home className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{expandedCurrent}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">온보딩에서 설정한 위치</p>
          </div>
          <span className="text-[10px] font-bold text-primary bg-white border border-primary/30 px-1.5 py-0.5 rounded">
            현재
          </span>
        </div>

        {/* 검색 */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="시·군·구로 검색 (예: 전북 김제시)"
            className="w-full pl-10 pr-3 py-3 text-sm rounded-2xl border border-border bg-card"
          />
        </div>

        <div className="max-h-[40vh] overflow-y-auto space-y-1.5">
          {q.trim() ? (
            results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-foreground font-medium">
                  '{q}'에 해당하는 지역을 찾을 수 없습니다.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  시·군·구 단위로 검색해주세요.
                </p>
              </div>
            ) : (
              results.map((r) => (
                <RegionRow
                  key={r}
                  label={r}
                  selected={draft === r}
                  onClick={() => setDraft(r)}
                />
              ))
            )
          ) : recentList.length > 0 ? (
            <div>
              <p className="text-[11px] font-bold text-muted-foreground px-1 mb-1.5">최근 사용한 위치</p>
              {recentList.map((r) => (
                <RegionRow
                  key={r}
                  label={r}
                  isCurrent={r === expandedCurrent}
                  selected={draft === r}
                  onClick={() => setDraft(r)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-1 mt-3 text-[11px] text-muted-foreground">
          <AlertTriangle className="w-3 h-3" />
          <span>위치를 변경하면 물류비와 순이익이 다시 계산됩니다</span>
        </div>

        <button
          onClick={() => {
            onConfirm(draft);
            onOpenChange(false);
          }}
          disabled={disabled}
          className="w-full mt-3 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40"
        >
          이 위치로 계산하기
        </button>
      </DrawerContent>
    </Drawer>
  );
};

const RegionRow = ({
  label,
  selected,
  isCurrent,
  onClick,
}: {
  label: string;
  selected: boolean;
  isCurrent?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border min-h-[48px] ${
      selected ? "border-primary bg-primary/5" : "border-border bg-card"
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {isCurrent && (
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">현재</span>
      )}
    </div>
    <span
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        selected ? "border-primary bg-primary" : "border-border"
      }`}
    >
      {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
  </button>
);

export default LocationSheet;
