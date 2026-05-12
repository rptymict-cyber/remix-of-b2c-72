## 목표
- 작물 추가 화면(`/crop/add` 1단계)을 778개 작물 / 2,519개 품종 데이터로 확장
- 대표 작물 18종, 검색·대분류 카테고리 칩, 품종 바텀시트 흐름 정비
- 모든 바텀시트가 모바일 앱 프레임(430px) 안에서만 노출되도록 공통 컴포넌트 수정
- 2단계(등록 유형 / 재배 지역 / 기준 시장) 및 기존 톤은 그대로 유지

---

## 1. 데이터 레이어 신설

### 1-1. `src/data/cropCatalog.ts` 신규 작성
- 사용자 제공 19개 대분류 × 작물 × 품종 데이터를 그대로 옮김
- 타입:
  ```ts
  type CropCategory = "미곡류" | "맥류" | ... | "약용작물류";
  interface CropItem {
    id: string;          // 예: "fruit-apple"
    name: string;        // 화면 표기 (중분류명, "기타"인 경우 "과실류 기타")
    category: CropCategory;
    varieties: string[]; // 정제된 소분류 배열
    icon: string;        // emoji (1차)
    isRepresentative?: boolean;
  }
  ```
- 정제 규칙(데이터 빌드 시 적용):
  - 소분류 값이 `-`, `사용불가`이면 제외
  - 중분류명과 동일한 소분류는 제외하고 항상 맨 앞에 `"전체 품종"` 추가
  - 중복 품종명 dedupe
  - 중분류명이 `기타`이면 `name`을 `대분류명 + " 기타"`로 노출
  - `미곡류(일반)`처럼 대분류 전체를 의미하는 placeholder 항목 제외
- 검색용 인덱스 함수:
  ```ts
  searchCrops(q: string): CropItem[]
  // 작물명 또는 품종명 매치 → 작물 단위로 결과 반환 (중복 제거)
  ```
- 대표 작물 18종 ID 상수 export:
  - 벼, 배추, 무, 마늘, 양파, 고추(풋고추), 사과, 배, 감자, 고구마, 콩, 대파, 감귤, 복숭아, 수박, 딸기, 토마토, 상추

### 1-2. 기존 `src/data/catalog.ts`
- 시세/시장(MARKETS)·UI 곳곳에서 사용 중이라 그대로 유지
- 작물 추가 화면만 `cropCatalog`를 참조 (다른 화면은 영향 없음)

---

## 2. 작물 추가 화면(`src/pages/AddCrop.tsx`) 개편 — 1단계만 수정

유지: 헤더, 진행바, 본문 타이틀/설명, 검색창 placeholder, 선택한 작물 카드, 하단 다음 버튼, 2단계 전체.

변경/추가:

### 2-1. 카테고리 Chip 행
- 검색창 바로 아래 가로 스크롤 chip 행
- 옵션: `전체` + 19개 대분류
- 선택 chip은 primary 배경, 비선택은 카드 톤
- 선택 시 해당 카테고리 작물만 필터

### 2-2. 검색 동작
- 입력값으로 `searchCrops(q)` 호출
- 작물명/품종명 모두 매치, 결과는 작물 카드 단위
- 결과 없을 때 `검색 결과가 없습니다.` 노출

### 2-3. 대표 작물 영역
- 검색어가 비어 있고 카테고리가 `전체`일 때만 표시
- 헤더 `대표 작물` + 18개 3열 그리드 (간격 `gap-y-5`)
- 그 아래 `전체 작물` 헤더 + 카테고리 필터 적용된 전체 리스트(3열 그리드, 동일 셀 스타일)

### 2-4. 작물 셀
- 기존 원형 아이콘 + 이름 구조 유지 (`w-[72px] h-[72px]`)
- 선택 상태에서 primary 보더 + 그림자 유지
- 아이콘은 `cropCatalog`의 `icon` 사용 (1차 emoji, 추후 일러스트 교체 여지)

### 2-5. 품종 바텀시트
- 타이틀: `${작물명} 품종 선택`
- 1번째 옵션 항상 `전체 품종`, 기본 선택값도 `전체 품종`
- `선택 완료` 버튼은 항상 활성, 클릭 시 닫고 카드에 반영
- 선택한 작물 카드 표기: `${작물명} · ${품종}` (예: `배추 · 봄배추`)
- 카드의 `변경` 클릭 시 동일 시트 재호출
- 다른 작물 선택 시 `variety`를 `전체 품종`으로 리셋

---

## 3. 바텀시트 공통 가로폭 수정 (앱 전역 영향)

### 문제
`vaul` 기반 `DrawerContent`가 `fixed inset-x-0`으로 뷰포트 전폭을 차지 → 데스크톱(>430px)에서 앱 프레임 밖으로 벌어짐.

### 해결: `src/components/ui/drawer.tsx` 한 곳만 수정
```tsx
// DrawerContent
className={cn(
  "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] ...",
  className,
)}
// DrawerOverlay 도 동일한 max-w-[430px] mx-auto 적용해 어둡기 영역도 프레임 안으로 한정
```
- 모든 바텀시트(`VarietySheet`, `CropSheet`, `MarketSheet`, `MarketDetailSheet`, `QtySheet`, `UpgradeModal` 중 Drawer 사용분, `AddCrop` 내부 Drawer)가 자동 적용
- 내부 padding/리스트는 이미 % 기반이라 추가 수정 불필요
- 변경 후 `App.tsx`의 앱 프레임(`max-w-[430px] mx-auto`) 기준과 정확히 정렬

---

## 4. 영향 받지 않는 부분 (명시)
- 2단계 화면(등록 유형 / 재배 지역 / 기준 시장) — 그대로 유지
- 출하 정보·알림 설정·3개 등록 제한 — 추가하지 않음
- 시세/예측/판매처/홈 등 다른 화면의 데이터 소스(`catalog.ts`)는 변경 없음

---

## 5. 작업 순서
1. `src/data/cropCatalog.ts` 작성 (데이터 + 정제 규칙 + `searchCrops`)
2. `src/components/ui/drawer.tsx` width 수정
3. `src/pages/AddCrop.tsx` 1단계 리팩터:
   - `useApp` 외 신규 카탈로그 사용
   - 카테고리 chip + 검색 + 대표/전체 그리드
   - 품종 시트 로직 재정비 (전체 품종 기본값)
4. 빌드 통과 확인

---

## 기술 메모 (참고용)
- 데이터 변환은 빌드타임 상수 배열로 직접 작성 (런타임 파싱 X)
- `id` 규칙: `${categorySlug}-${nameSlug}` (영문 슬러그 매핑은 카테고리·작물별 수기, 충돌 방지)
- 카테고리 chip은 가로 스크롤 (`overflow-x-auto`, `scrollbar-hide`)
- 대표 작물 18종은 `cropCatalog`의 `isRepresentative: true` 플래그로 표시
- 검색 매칭은 `String.includes` (한글 부분일치, 정렬: 작물명 매치 우선 → 품종 매치)
