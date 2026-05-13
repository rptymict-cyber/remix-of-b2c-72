# 작물 선택 기본값 및 전역 동기화 수정 계획

## 진단

전역 상태(`useApp` zustand + persist)에는 이미 `profile.myCrops`, `cropId`, `toggleMyCrop`, `removeMyCrop`이 존재하며 모든 페이지(홈/시세/예측/판매처/작물/마이페이지)가 동일한 store의 `cropId`/`profile.myCrops`를 구독하고 있어 구조적 분기는 없음. 다만 다음 3가지 누락으로 증상이 발생함.

1. **AddCrop `submit()`이 `myCrops`에 작물을 추가하지 않음** — 단순히 `setMarket` 후 `nav("/crop")`만 호출. 토스트 문구도 요구사항과 불일치.
2. **삭제 시 토스트 문구 불일치** — `CropSettings.tsx`의 `removeMyCrop` 호출 후 토스트가 "{이름}이(가) 삭제되었습니다" 로 되어 있음. `FarmEdit.tsx` 저장 경로에서도 삭제 후 잔존 작물에 대한 `cropId` 정합성 보정 없음.
3. **홈 진입 시 `cropId`가 `myCrops`에 없을 수 있음** — 초기값 `"pepper"`가 온보딩에서 선택한 작물에 포함되지 않으면 어떤 칩도 selected 상태가 되지 않음(현재 칩은 `c.id === cropId` 비교).

## 수정 내용

### 1. `src/store/appStore.ts` — 단일 진실 공급원 보강
- `toggleMyCrop`/`removeMyCrop`/`setProfile`에 **cropId 자동 보정 로직** 추가.
  - 추가 시: 신규 작물을 `cropId`로 자동 선택(현재 `cropId`가 `myCrops`에 없거나 갓 추가된 작물이면).
  - 삭제 시: 삭제 대상이 현재 `cropId`였다면 남은 `myCrops[0]`로 변경, 비면 빈 문자열.
- 새 액션 `addMyCrop(id)` 추가(이미 존재하면 noop, 3개 제한 유지) — AddCrop 흐름에서 사용.
- `ensureSelectedCrop()` 셀렉터/액션 추가: 현재 `cropId`가 `myCrops`에 없으면 첫 번째로 보정.

### 2. `src/pages/AddCrop.tsx`
- `submit()`에서 `addMyCrop(selectedCropId)` + `setCrop(selectedCropId, varieties[0])` + `setMarket(marketSel)` 순서로 호출.
- 토스트 문구를 `${crop.name}이(가) 내 작물에 추가됐어요`로 변경.
- 이미 보유한 작물 재선택 시 중복 추가 방지(기존 store 로직 유지).

### 3. `src/pages/CropSettings.tsx`
- 삭제 토스트 문구를 `${crop.name}이(가) 내 작물에서 삭제됐어요`로 변경.
- `removeMyCrop`은 store에서 cropId 자동 보정되므로 호출 측 변경 없음.

### 4. `src/pages/FarmEdit.tsx`
- 저장 시 `myCrops` 변경(추가/삭제) 후 store 업데이트로 cropId 자동 정합 — `setProfile` 분기 안에서 cropId 보정 로직 동작 확인. 필요 시 저장 직후 `ensureSelectedCrop()` 호출.

### 5. `src/pages/Index.tsx` (홈)
- 마운트 시 `useEffect`로 `ensureSelectedCrop()` 호출하여 `cropId`가 항상 `myCrops`에 속하도록 보장.
- `myCrops.length === 0`이면 칩 영역에 "+ 작물 추가" 버튼만 노출(현재 안내 문구 제거하고 버튼 강조).
- `myCrops.length === 1`이면 항상 selected 상태로 렌더(현재 로직과 동일하게 동작하지만 cropId 보정 후 보장됨).

### 6. 동기화 검증
다음 페이지는 모두 `useApp`의 `cropId`/`profile.myCrops`를 직접 구독하므로 store 변경 즉시 리렌더링됨 — 추가 작업 불필요:
- `MarketPrice.tsx`, `AIPrediction.tsx`, `SalesChannel.tsx`, `CropRecommend.tsx`, `MyPage.tsx`, `BottomNav` 등.

## 비변경 범위
- UI/디자인, 레이아웃, 다른 페이지 비즈니스 로직, 시장/단가/물류비 계산, 판매처 지도 등 일체 변경 없음.
- `persist` 동작 유지(앱 재진입 시 마지막 cropId 복원).

## 검증 방법
- 온보딩 완료 → 홈 진입 시 첫 작물 칩이 selected 상태로 표시되는지 확인.
- AddCrop에서 작물 추가 → 홈/시세/예측/판매처/작물/마이페이지에서 즉시 반영 확인.
- CropSettings에서 현재 선택된 작물 삭제 → 다음 작물로 자동 전환되고 모든 페이지에 반영 확인.
- 토스트 문구가 요구사항과 정확히 일치하는지 확인.
