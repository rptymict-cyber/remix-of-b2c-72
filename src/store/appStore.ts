import { create } from "zustand";
import { persist } from "zustand/middleware";
import { resolveRepresentativeId } from "@/data/catalog";


export type Plan = "Free" | "Basic" | "Pro" | "Premium";
export type Unit = "kg" | "box" | "ton";
export type ShipmentBasis = "current" | "forecast";
export type CultivationMethod = "노지" | "시설";
export type SeasonBasis = "이번" | "다음";
export type UserType = "farmer" | "wholesaler" | "retailer" | "enterprise" | null;

export type CropRegType = "growing" | "interest";
export type PriceDisplayMode = "actual" | "1kg" | "10kg" | "20kg" | "100kg" | "default";
export interface CropSetting {
  regType: CropRegType;
  region: string;
  marketId: string;
  selectedVarieties?: string[];
  priceDisplayMode?: PriceDisplayMode;
  alertEnabled?: boolean;
  alertRules?: string[];
}

export interface UserProfile {
  name: string;
  region: string; // "충남 공주시"
  farmSize: "소규모" | "중규모" | "대규모";
  farmAreaM2: number;
  myCrops: string[]; // crop ids
  plan: Plan;
  onboarded: boolean;
  cultivationMethod?: CultivationMethod;
  seasonBasis?: SeasonBasis;
  cropSettings?: Record<string, CropSetting>;
  userType?: UserType;
  favMarkets?: string[];
  interestCrops?: string[];
}


export interface NotificationSettings {
  priceAlert: boolean;
  priceThreshold: number; // %
  forecastUpdate: boolean;
  shipD3: boolean;
  shipD1: boolean;
  marketHoliday: boolean;
  holidayLeadDays: 1 | 3;
}

interface AppState {
  // selection
  cropId: string;
  variety: string;
  marketId: string;
  unit: Unit;
  unitKg: number;
  shipQtyKg: number;
  basis: ShipmentBasis;
  // user
  profile: UserProfile;
  notif: NotificationSettings;
  // setters
  setCrop: (id: string, variety?: string) => void;
  setVariety: (v: string) => void;
  setMarket: (id: string) => void;
  setUnit: (u: Unit) => void;
  setUnitKg: (kg: number) => void;
  setShipQty: (kg: number) => void;
  setBasis: (b: ShipmentBasis) => void;
  setProfile: (p: Partial<UserProfile>) => void;
  setNotif: (n: Partial<NotificationSettings>) => void;
  toggleMyCrop: (id: string) => void;
  addMyCrop: (id: string) => void;
  setCropSetting: (id: string, s: Partial<CropSetting>) => void;
  removeMyCrop: (id: string) => void;
  toggleFavMarket: (id: string) => void;
  toggleInterestCrop: (id: string) => void;
  ensureSelectedCrop: () => void;
  completeOnboarding: () => void;
}


export const useApp = create<AppState>()(
  persist(
    (set) => ({
      cropId: "pepper",
      variety: "건고추(화건)",
      marketId: "garak",
      unit: "kg",
      unitKg: 20,
      shipQtyKg: 500,
      basis: "current",
      profile: {
        name: "농부",
        region: "충남 공주시",
        farmSize: "중규모",
        farmAreaM2: 2000,
        myCrops: ["pepper", "cabbage", "apple"],
        plan: "Free",
        onboarded: false,
        cultivationMethod: "노지",
        seasonBasis: "이번",
        favMarkets: ["garak", "daegu"],
        interestCrops: ["onion", "tomato"],
      },

      notif: {
        priceAlert: true,
        priceThreshold: 10,
        forecastUpdate: true,
        shipD3: true,
        shipD1: true,
        marketHoliday: true,
        holidayLeadDays: 3,
      },
      setCrop: (id, variety) =>
        set((s) => ({ cropId: id, variety: variety ?? s.variety })),
      setVariety: (v) => set({ variety: v }),
      setMarket: (id) => set({ marketId: id }),
      setUnit: (u) => set({ unit: u }),
      setUnitKg: (kg) => set({ unitKg: kg }),
      setShipQty: (kg) => set({ shipQtyKg: kg }),
      setBasis: (b) => set({ basis: b }),
      setProfile: (p) =>
        set((s) => {
          const profile = { ...s.profile, ...p };
          let cropId = s.cropId;
          if (p.myCrops) {
            if (profile.myCrops.length === 0) cropId = "";
            else if (!profile.myCrops.includes(cropId)) cropId = profile.myCrops[0];
          }
          return { profile, cropId };
        }),
      setNotif: (n) => set((s) => ({ notif: { ...s.notif, ...n } })),
      toggleMyCrop: (id) =>
        set((s) => {
          const has = s.profile.myCrops.includes(id);
          const next = has
            ? s.profile.myCrops.filter((c) => c !== id)
            : s.profile.myCrops.length >= 30
              ? s.profile.myCrops
              : [...s.profile.myCrops, id];
          let cropId = s.cropId;
          if (has && id === cropId) cropId = next[0] ?? "";
          else if (!has && !next.includes(cropId)) cropId = next[0] ?? cropId;
          return { profile: { ...s.profile, myCrops: next }, cropId };
        }),
      addMyCrop: (id) =>
        set((s) => {
          if (s.profile.myCrops.includes(id)) return { cropId: id };
          if (s.profile.myCrops.length >= 30) return {};
          const next = [...s.profile.myCrops, id];
          return { profile: { ...s.profile, myCrops: next }, cropId: id };
        }),
      setCropSetting: (id, partial) =>
        set((s) => {
          const prev = s.profile.cropSettings?.[id] ?? {
            regType: "growing" as CropRegType,
            region: s.profile.region,
            marketId: s.marketId,
          };
          return {
            profile: {
              ...s.profile,
              cropSettings: {
                ...(s.profile.cropSettings ?? {}),
                [id]: { ...prev, ...partial },
              },
            },
          };
        }),
      removeMyCrop: (id) =>
        set((s) => {
          const { [id]: _drop, ...rest } = s.profile.cropSettings ?? {};
          const nextCrops = s.profile.myCrops.filter((c) => c !== id);
          const cropId = s.cropId === id ? (nextCrops[0] ?? "") : s.cropId;
          return {
            profile: {
              ...s.profile,
              myCrops: nextCrops,
              cropSettings: rest,
            },
            cropId,
          };
        }),
      toggleFavMarket: (id) =>
        set((s) => {
          const cur = s.profile.favMarkets ?? [];
          const next = cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id];
          return { profile: { ...s.profile, favMarkets: next } };
        }),
      toggleInterestCrop: (id) =>
        set((s) => {
          const cur = s.profile.interestCrops ?? [];
          const next = cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id];
          return { profile: { ...s.profile, interestCrops: next } };
        }),

      ensureSelectedCrop: () =>
        set((s) => {
          if (s.profile.myCrops.length === 0) return {};
          if (s.profile.myCrops.includes(s.cropId)) return {};
          return { cropId: s.profile.myCrops[0] };
        }),
      completeOnboarding: () =>
        set((s) => ({ profile: { ...s.profile, onboarded: true } })),
    }),
    {
      name: "farminsight-app",
      // 기존에 저장된 확장 카탈로그 id (예: "c0-0") 를 가능한 경우 대표 id 로 마이그레이션.
      // 매핑이 없는 id는 그대로 두며 findCrop 이 안전하게 처리한다.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const remap = (id: string) => (id ? resolveRepresentativeId(id) ?? id : id);
        state.cropId = remap(state.cropId);
        state.profile.myCrops = (state.profile.myCrops ?? []).map(remap);
        state.profile.interestCrops = (state.profile.interestCrops ?? []).map(remap);
        if (state.profile.cropSettings) {
          const next: Record<string, CropSetting> = {};
          for (const [k, v] of Object.entries(state.profile.cropSettings)) {
            next[remap(k)] = v;
          }
          state.profile.cropSettings = next;
        }
      },
    },
  ),
);
