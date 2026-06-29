import { ALL_CROPS as EXT_CROPS, findCropById as findExtCropById } from "./cropCatalog";

export interface Crop {
  id: string;
  name: string;
  emoji: string;
  varieties: string[];
  defaultUnitKg: number;
  weatherSensitivity: "낮음" | "중간" | "높음";
  harvestSeason: string;
}


export interface Market {
  id: string;
  name: string;
  region: string;
  regionGroup: "서울/경기" | "영남" | "호남" | "충청";
  distanceKm: number;
  holiday: string;
  todayClosed?: boolean;
  corporations: string[];
}

export const CROPS: Crop[] = [
  { id: "rice", name: "벼", emoji: "🌾", varieties: ["일반계", "찰벼"], defaultUnitKg: 40, weatherSensitivity: "중간", harvestSeason: "9월~10월" },
  { id: "pepper", name: "고추", emoji: "🌶️", varieties: ["건고추(화건)", "건고추(양건)", "풋고추", "청양고추"], defaultUnitKg: 20, weatherSensitivity: "높음", harvestSeason: "8월~10월" },
  { id: "apple", name: "사과", emoji: "🍎", varieties: ["후지", "홍로", "감홍"], defaultUnitKg: 20, weatherSensitivity: "높음", harvestSeason: "9월~11월" },
  { id: "pear", name: "배", emoji: "🍐", varieties: ["신고", "원황", "추황"], defaultUnitKg: 15, weatherSensitivity: "높음", harvestSeason: "9월~10월" },
  { id: "cabbage", name: "배추", emoji: "🥬", varieties: ["봄배추", "고랭지배추", "가을배추"], defaultUnitKg: 10, weatherSensitivity: "높음", harvestSeason: "5월~11월" },
  { id: "onion", name: "양파", emoji: "🧅", varieties: ["황양파", "자색양파"], defaultUnitKg: 15, weatherSensitivity: "중간", harvestSeason: "5월~6월" },
  { id: "radish", name: "무", emoji: "🌿", varieties: ["봄무", "가을무", "월동무"], defaultUnitKg: 18, weatherSensitivity: "중간", harvestSeason: "10월~11월" },
  { id: "tomato", name: "토마토", emoji: "🍅", varieties: ["일반토마토", "방울토마토", "대추방울"], defaultUnitKg: 5, weatherSensitivity: "중간", harvestSeason: "5월~10월" },
  { id: "strawberry", name: "딸기", emoji: "🍓", varieties: ["설향", "장희", "죽향"], defaultUnitKg: 2, weatherSensitivity: "높음", harvestSeason: "12월~5월" },
  { id: "potato", name: "감자", emoji: "🥔", varieties: ["수미", "대지", "두백"], defaultUnitKg: 20, weatherSensitivity: "낮음", harvestSeason: "6월~9월" },
  { id: "sweet_potato", name: "고구마", emoji: "🍠", varieties: ["호박고구마", "밤고구마", "꿀고구마"], defaultUnitKg: 10, weatherSensitivity: "낮음", harvestSeason: "9월~11월" },
  { id: "garlic", name: "마늘", emoji: "🧄", varieties: ["남도마늘", "한지형"], defaultUnitKg: 10, weatherSensitivity: "중간", harvestSeason: "6월~7월" },
  { id: "soybean", name: "콩", emoji: "🫘", varieties: ["백태", "서리태", "쥐눈이콩"], defaultUnitKg: 30, weatherSensitivity: "중간", harvestSeason: "10월~11월" },
  { id: "green_onion", name: "대파", emoji: "🌱", varieties: ["대파", "쪽파"], defaultUnitKg: 5, weatherSensitivity: "중간", harvestSeason: "연중" },
  { id: "mandarin", name: "감귤", emoji: "🍊", varieties: ["노지감귤", "한라봉", "천혜향"], defaultUnitKg: 10, weatherSensitivity: "높음", harvestSeason: "11월~2월" },
  { id: "peach", name: "복숭아", emoji: "🍑", varieties: ["백도", "황도", "천도"], defaultUnitKg: 5, weatherSensitivity: "높음", harvestSeason: "7월~9월" },
  { id: "watermelon", name: "수박", emoji: "🍉", varieties: ["일반수박", "씨없는수박"], defaultUnitKg: 8, weatherSensitivity: "높음", harvestSeason: "6월~8월" },
  { id: "lettuce", name: "상추", emoji: "🥗", varieties: ["청상추", "적상추", "꽃상추"], defaultUnitKg: 4, weatherSensitivity: "중간", harvestSeason: "연중" },
  { id: "corn", name: "옥수수", emoji: "🌽", varieties: ["찰옥수수", "단옥수수"], defaultUnitKg: 10, weatherSensitivity: "중간", harvestSeason: "7월~9월" },
];

export const MARKETS: Market[] = [
  { id: "garak", name: "서울 가락시장", region: "서울특별시 송파구", regionGroup: "서울/경기", distanceKm: 130, holiday: "매주 일요일", corporations: ["서울청과(주)", "중앙청과(주)", "동화청과(주)"] },
  { id: "gangseo", name: "서울 강서시장", region: "서울특별시 강서구", regionGroup: "서울/경기", distanceKm: 145, holiday: "매주 일요일", corporations: ["강서청과(주)", "농협가락(주)"] },
  { id: "daegu", name: "대구북부시장", region: "대구광역시 북구", regionGroup: "영남", distanceKm: 180, holiday: "매주 일요일", corporations: ["효성청과(주)", "대구청과(주)", "영남청과(주)"] },
  { id: "busan", name: "부산엄궁시장", region: "부산광역시 사상구", regionGroup: "영남", distanceKm: 320, holiday: "매주 일요일", corporations: ["부산청과(주)", "동부청과(주)"] },
  { id: "anyang", name: "안양시장", region: "경기도 안양시", regionGroup: "서울/경기", distanceKm: 95, holiday: "매주 일요일", corporations: ["안양청과(주)", "경기청과(주)"] },
  { id: "gwangju", name: "광주서부시장", region: "광주광역시 서구", regionGroup: "호남", distanceKm: 290, holiday: "매주 일요일", corporations: ["광주청과(주)", "호남청과(주)"] },
  { id: "suwon", name: "수원시장", region: "경기도 수원시", regionGroup: "서울/경기", distanceKm: 110, holiday: "매주 일요일", corporations: ["수원청과(주)"] },
  { id: "cheongju", name: "청주시장", region: "충청북도 청주시", regionGroup: "충청", distanceKm: 65, holiday: "매주 일요일", corporations: ["청주청과(주)"] },
];

export const REGION_GROUPS = ["전체", "서울/경기", "영남", "호남", "충청"] as const;

// 확장 카탈로그 작물명 → 대표 카탈로그 id 매핑
// AddCrop에서 확장 카탈로그(c0-0 등)로 선택한 작물을 앱 전체가 인식하는 안정적인 id로 변환할 때 사용한다.
const NAME_TO_REP_ID: Record<string, string> = {
  벼: "rice",
  쌀: "rice",
  찰벼: "rice",
  고추: "pepper",
  풋고추: "pepper",
  건고추: "pepper",
  꽈리고추: "pepper",
  홍고추: "pepper",
  청양고추: "pepper",
  사과: "apple",
  배: "pear",
  배추: "cabbage",
  양파: "onion",
  무: "radish",
  토마토: "tomato",
  방울토마토: "tomato",
  딸기: "strawberry",
  감자: "potato",
  고구마: "sweet_potato",
  마늘: "garlic",
  콩: "soybean",
  대파: "green_onion",
  쪽파: "green_onion",
  실파: "green_onion",
  감귤: "mandarin",
  복숭아: "peach",
  수박: "watermelon",
  상추: "lettuce",
  옥수수: "corn",
};

/**
 * 입력값이 대표 카탈로그 id이면 그대로 반환.
 * 확장 카탈로그 id이면 같은 작물명의 대표 카탈로그 id로 매핑한다.
 * 작물명 문자열이 들어와도 대표 id를 시도한다.
 * 매칭 실패 시 undefined.
 */
export function resolveRepresentativeId(idOrName: string): string | undefined {
  if (!idOrName) return undefined;
  if (CROPS.some((c) => c.id === idOrName)) return idOrName;
  const ext = findExtCropById(idOrName);
  if (ext && NAME_TO_REP_ID[ext.name]) return NAME_TO_REP_ID[ext.name];
  if (NAME_TO_REP_ID[idOrName]) return NAME_TO_REP_ID[idOrName];
  return undefined;
}

const UNKNOWN_CROP: Crop = {
  id: "__unknown__",
  name: "알 수 없는 작물",
  emoji: "❓",
  varieties: [],
  defaultUnitKg: 10,
  weatherSensitivity: "중간",
  harvestSeason: "-",
};

/**
 * 안전한 작물 해석기.
 * 1) 대표 카탈로그 id면 해당 Crop
 * 2) 확장 카탈로그 id면 대표 매핑 후 매핑된 Crop, 매핑 실패 시 확장 정보를 Crop 형태로 합성
 * 3) 어느 것도 매칭되지 않으면 "알 수 없는 작물" 플레이스홀더 (절대 조용히 "벼"로 떨어지지 않음)
 */
export const findCrop = (id: string): Crop => {
  if (!id) return UNKNOWN_CROP;
  const direct = CROPS.find((c) => c.id === id);
  if (direct) return direct;
  const repId = resolveRepresentativeId(id);
  if (repId) {
    const rep = CROPS.find((c) => c.id === repId);
    if (rep) return rep;
  }
  const ext = findExtCropById(id);
  if (ext) {
    return {
      id: ext.id,
      name: ext.name,
      emoji: ext.icon,
      varieties: ext.varieties,
      defaultUnitKg: 10,
      weatherSensitivity: "중간",
      harvestSeason: "-",
    };
  }
  if (typeof console !== "undefined") {
    console.warn(`[catalog] findCrop: unknown crop id "${id}"`);
  }
  return { ...UNKNOWN_CROP, id };
};

export const findMarket = (id: string) => MARKETS.find((m) => m.id === id) || MARKETS[0];


// Deterministic seeded "price" per (crop, market, variety)
export const seedPrice = (cropId: string, marketId: string, variety?: string) => {
  const seed = [...(cropId + marketId + (variety || ""))].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 30000 + (seed % 25) * 1000;
  return Math.round(base / 100) * 100;
};

// 7일 가격 흐름 시드 (현재가 기준 ±5% 내 변동)
export const seedPriceHistory = (cropId: string, marketId: string, variety: string, days = 7): number[] => {
  const base = seedPrice(cropId, marketId, variety);
  const seed = [...(cropId + marketId + variety)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const t = (seed * (i + 1)) % 97;
    const delta = ((t / 97) - 0.45) * 0.08; // -3.6% ~ +4.4%
    const v = Math.round((base * (0.96 + (i / (days - 1)) * 0.06 + delta)) / 100) * 100;
    out.push(v);
  }
  out[out.length - 1] = base; // 마지막 = 현재가
  return out;
};

// 오늘 주목 작물 (홈 화면용)
export interface FeaturedCrop {
  cropId: string;
  marketId: string;
  variety: string;
  unitKg: number;
  price: number;
  priceChangePct: number;
  volumeChangePct: number;
  badge: "거래량 급증" | "가격 상승" | "하락 주의";
}

export const FEATURED_CROPS: FeaturedCrop[] = [
  { cropId: "cabbage", marketId: "garak", variety: "가을배추", unitKg: 10, price: 12800, priceChangePct: 4.8, volumeChangePct: 31.2, badge: "거래량 급증" },
  { cropId: "onion", marketId: "daegu", variety: "황양파", unitKg: 15, price: 18400, priceChangePct: 6.1, volumeChangePct: 12.4, badge: "가격 상승" },
  { cropId: "tomato", marketId: "busan", variety: "일반토마토", unitKg: 5, price: 9000, priceChangePct: -3.2, volumeChangePct: -8.7, badge: "하락 주의" },
];

export const transportCost = (distanceKm: number, qtyKg: number) => {
  // 5톤 트럭 추정: 기본 30,000 + 거리·중량 비례
  return Math.round((30000 + distanceKm * 320 + qtyKg * 30) / 1000) * 1000;
};

export const REGIONS_KR: Record<string, string[]> = {
  서울특별시: ["강남구", "송파구", "강서구"],
  경기도: ["수원시", "안양시", "성남시", "용인시"],
  강원도: ["춘천시", "원주시", "강릉시"],
  충청북도: ["청주시", "충주시", "제천시"],
  충청남도: ["천안시", "공주시", "아산시", "논산시"],
  전라북도: ["전주시", "익산시", "군산시"],
  전라남도: ["목포시", "여수시", "순천시"],
  경상북도: ["대구시", "포항시", "경주시", "안동시", "예천군"],
  경상남도: ["창원시", "진주시", "김해시"],
  제주도: ["제주시", "서귀포시"],
};