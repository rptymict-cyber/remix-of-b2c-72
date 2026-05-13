import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Plan = "Free" | "Basic" | "Pro" | "Premium";
export type Unit = "kg" | "box" | "ton";
export type ShipmentBasis = "current" | "forecast";
export type CultivationMethod = "노지" | "시설";
export type SeasonBasis = "이번" | "다음";

export type CropRegType = "growing" | "interest";
export interface CropSetting {
  regType: CropRegType;
  region: string;
  marketId: string;
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
  setShipQty: (kg: number) => void;
  setBasis: (b: ShipmentBasis) => void;
  setProfile: (p: Partial<UserProfile>) => void;
  setNotif: (n: Partial<NotificationSettings>) => void;
  toggleMyCrop: (id: string) => void;
  addMyCrop: (id: string) => void;
  setCropSetting: (id: string, s: Partial<CropSetting>) => void;
  removeMyCrop: (id: string) => void;
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
      setShipQty: (kg) => set({ shipQtyKg: kg }),
      setBasis: (b) => set({ basis: b }),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setNotif: (n) => set((s) => ({ notif: { ...s.notif, ...n } })),
      toggleMyCrop: (id) =>
        set((s) => {
          const has = s.profile.myCrops.includes(id);
          const next = has
            ? s.profile.myCrops.filter((c) => c !== id)
            : s.profile.myCrops.length >= 3
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
          if (s.profile.myCrops.length >= 3) return {};
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
      ensureSelectedCrop: () =>
        set((s) => {
          if (s.profile.myCrops.length === 0) return {};
          if (s.profile.myCrops.includes(s.cropId)) return {};
          return { cropId: s.profile.myCrops[0] };
        }),
      completeOnboarding: () =>
        set((s) => ({ profile: { ...s.profile, onboarded: true } })),
    }),
    { name: "farminsight-app" },
  ),
);