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
  { id: "pepper", name: "고추", emoji: "🌶️", varieties: ["건고추(화건)", "건고추(양건)", "풋고추", "청양고추"], defaultUnitKg: 20, weatherSensitivity: "높음", harvestSeason: "8월~10월" },
  { id: "apple", name: "사과", emoji: "🍎", varieties: ["후지", "홍로", "감홍"], defaultUnitKg: 20, weatherSensitivity: "높음", harvestSeason: "9월~11월" },
  { id: "cabbage", name: "배추", emoji: "🥬", varieties: ["봄배추", "고랭지배추", "가을배추"], defaultUnitKg: 10, weatherSensitivity: "높음", harvestSeason: "5월~11월" },
  { id: "onion", name: "양파", emoji: "🧅", varieties: ["황양파", "자색양파"], defaultUnitKg: 15, weatherSensitivity: "중간", harvestSeason: "5월~6월" },
  { id: "radish", name: "무", emoji: "🌿", varieties: ["봄무", "가을무", "월동무"], defaultUnitKg: 18, weatherSensitivity: "중간", harvestSeason: "10월~11월" },
  { id: "tomato", name: "토마토", emoji: "🍅", varieties: ["일반토마토", "방울토마토", "대추방울"], defaultUnitKg: 5, weatherSensitivity: "중간", harvestSeason: "5월~10월" },
  { id: "strawberry", name: "딸기", emoji: "🍓", varieties: ["설향", "장희", "죽향"], defaultUnitKg: 2, weatherSensitivity: "높음", harvestSeason: "12월~5월" },
  { id: "potato", name: "감자", emoji: "🥔", varieties: ["수미", "대지", "두백"], defaultUnitKg: 20, weatherSensitivity: "낮음", harvestSeason: "6월~9월" },
  { id: "garlic", name: "마늘", emoji: "🧄", varieties: ["남도마늘", "한지형"], defaultUnitKg: 10, weatherSensitivity: "중간", harvestSeason: "6월~7월" },
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

export const findCrop = (id: string) => CROPS.find((c) => c.id === id) || CROPS[0];
export const findMarket = (id: string) => MARKETS.find((m) => m.id === id) || MARKETS[0];

// Deterministic seeded "price" per (crop, market, variety)
export const seedPrice = (cropId: string, marketId: string, variety?: string) => {
  const seed = [...(cropId + marketId + (variety || ""))].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 30000 + (seed % 25) * 1000;
  return Math.round(base / 100) * 100;
};

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