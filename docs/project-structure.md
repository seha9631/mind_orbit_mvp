# 🗺 Mind Orbit MVP — 프로젝트 구조 가이드

---

## 00. 이 문서의 목적

마인드 오빗 MVP를 빠르게 개발하기 위한 최종 프로젝트 구조, 각 폴더의 역할, 그리고 협업 시 지켜야 할 가이드라인을 정의한다. 리뷰를 통해 도출된 보완 사항을 모두 반영한 최종 버전이다.

> **팀 핵심 원칙**
> - 기능을 과하게 잘게 쪼개지 않는다.
> - 바이브 코딩에 맞게 문맥이 큰 구조를 유지한다.
> - 복잡해지기 쉬운 핵심 로직만 분리한다.
> - 모바일 UX와 IndexedDB 안정성을 최우선으로 둔다.

---

## 01. 폴더 구조

```
docs/
  project-structure.md         ← 프로젝트 구조 가이드 (이 문서)
  branch-strategy.md   ← 브랜치 전략

src/
  app/
    App.tsx
    router.tsx
    styles.css

  pages/
    landing/
      LandingPage.tsx

    dashboard/
      DashboardPage.tsx
      components/
        MapList.tsx
        MapCard.tsx
        CreateMapButton.tsx
      model/
        dashboardStore.ts
        dashboardActions.ts

    editor/
      EditorPage.tsx
      components/
        EditorHeader.tsx
        MindMapCanvas.tsx
        CanvasEventLayer.tsx
        NodeRenderer.tsx
        MindMapNode.tsx
        EdgeLayer.tsx
        MobileFab.tsx
        NodeActionMenu.tsx
      model/
        nodeStore.ts
        viewportStore.ts
        selectionStore.ts
        editorActions.ts
      hooks/
        useNodeDrag.ts
        usePanZoom.ts
        usePinchZoom.ts
        useAutoSave.ts

  domain/
    mindmap/
      types.ts
      tree.ts
      selectors.ts
      constants.ts

  services/
    db/
      indexeddb.ts
      mapRepository.ts
      migrations.ts

  shared/
    ui/
      Button.tsx
      Card.tsx
      IconButton.tsx
      Modal.tsx
      BottomSheet.tsx
    lib/
      id.ts
      geometry.ts
      clamp.ts
      time.ts
    types/
      common.ts
```

---

## 02. 레이어별 개요

| 레이어 | 역할 | 예시 |
|---|---|---|
| `docs/` | 개발 문서 | 프로젝트 구조 가이드, 브랜치 전략 |
| `app/` | 앱 전역 설정 | 라우터, 전역 Provider, 글로벌 CSS |
| `pages/` | 화면 단위 코드 | 각 페이지 컴포넌트, 해당 화면 전용 상태/훅 |
| `domain/` | 핵심 비즈니스 로직 | 트리 조작 함수, 타입 정의, 순수 계산 함수 |
| `services/` | 외부/브라우저 API 연결 | IndexedDB 연결, 데이터 저장·조회 |
| `shared/` | 공용 UI 및 유틸 | 버튼, 모달, id 생성, 좌표 계산 |

> **문서 관리 원칙** — 코딩 중에 참조하는 문서(`docs/`)는 레포에서, 팀 전체가 함께 보며 업데이트하는 문서(PRD, 기능 체크리스트)는 Notion에서 관리한다.

---

## 03. 파일 위치 판단 기준

```
1. 특정 화면에서만 쓰는가?
   YES → pages/<해당화면>/

2. 마인드맵 핵심 규칙인가? (트리 조작, 타입 등)
   YES → domain/mindmap/

3. 브라우저 API 직접 접근인가? (IndexedDB 등)
   YES → services/db/

4. 2개 이상 화면에서 재사용하는가?
   YES → shared/
   NO  → 가장 가까운 page 내부에 둔다
```

> 애매하면 `shared/`로 보내지 말고 가까운 곳에 먼저 둔다.
> `shared/`는 2곳 이상에서 쓰임이 확인된 것만 올린다.