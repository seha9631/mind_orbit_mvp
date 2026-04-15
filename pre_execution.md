# Mind Orbit MVP — Pre-Execution 정리 문서

> 작성일: 2026-04-15
> 브랜치: `claude/funny-montalcini`
> 마감: 2026-04-16 19:00 (스프린트 6)

---

## 1. 프로젝트 개요

**Mind Orbit MVP**는 서버 없이 브라우저에서 동작하는 오프라인 퍼스트 마인드맵 앱입니다.
- React + Vite + TypeScript 기반 SPA
- `@xyflow/react` (React Flow v12) 캔버스
- Zustand 전역 상태 관리
- IndexedDB(`idb`) 영속성 — 새로고침 후에도 데이터 보존
- QA 대상: **모바일 전용**

---

## 2. 디렉토리 구조

```
src/
├── app/
│   ├── App.tsx                  # 루트 컴포넌트 (EditorPage 직접 렌더)
│   └── App.css
├── pages/
│   └── editor/
│       ├── EditorPage.tsx       # ReactFlowProvider 래퍼
│       ├── components/
│       │   ├── MindMapCanvas.tsx   # 메인 캔버스 + FAB + 단축키
│       │   ├── MindMapNode.tsx     # 커스텀 노드 (인라인 편집 + 삭제 버튼)
│       │   └── MindMapEdge.tsx     # 직선 엣지
│       └── model/
│           ├── store.ts            # Zustand 스토어
│           └── persistence.ts      # IndexedDB 저장/로드 + 상태 콜백
├── services/
│   └── db/
│       ├── client.ts               # IndexedDB 싱글턴
│       ├── schema.ts               # MapRecord / NodeRecord / EdgeRecord 타입
│       ├── migrations.ts           # DB 버전 마이그레이션 (v0→v1)
│       └── repositories/
│           ├── nodeRepository.ts   # 노드 CRUD
│           └── edgeRepository.ts   # 엣지 CRUD
├── main.tsx
└── index.css                    # 전역 스타일 (노드, FAB, 삭제 버튼, 저장 상태)
```

---

## 3. 기술 스택

| 분류 | 라이브러리 | 버전 |
|------|-----------|------|
| UI 프레임워크 | React | ^19.2.4 |
| 빌드 도구 | Vite | ^8.0.4 |
| 언어 | TypeScript | ~6.0.2 |
| 캔버스 | @xyflow/react | ^12.10.2 |
| 상태 관리 | Zustand | (내부 의존) |
| IndexedDB | idb | ^8.0.3 |
| ID 생성 | nanoid/non-secure | (내부 의존) |

---

## 4. 구현 완료 기능

### 4-1. 기존 구현 (PR #1, 2026-04-13)

| 기능 | 파일 | 설명 |
|------|------|------|
| React Flow 캔버스 | `MindMapCanvas.tsx` | 무한 패닝/줌, 드래그 |
| 드래그로 자식 노드 생성 | `MindMapCanvas.tsx` | 핸들 드래그 → 빈 캔버스에 놓으면 생성 |
| 노드 인라인 편집 | `MindMapNode.tsx` | 클릭 시 포커스, 텍스트 너비 자동 조절 |
| IndexedDB 자동저장 | `persistence.ts` | 500ms 디바운스 |
| 앱 시작 시 DB 로드 | `store.ts` | `loadFromDB()` |
| 첫 실행 시 데모 데이터 시드 | `store.ts` | `INITIAL_NODES / INITIAL_EDGES` |
| DB 스키마 & 마이그레이션 | `schema.ts`, `migrations.ts` | v1: maps/nodes/edges 오브젝트 스토어 |
| 노드/엣지 Repository | `nodeRepository.ts`, `edgeRepository.ts` | `getByMapId`, `replaceAll` (트랜잭션) |

### 4-2. 이번 세션 구현 (2026-04-15)

#### P0 — 모바일 FAB 버튼 & 터치 최적화
- **파일:** `MindMapCanvas.tsx`, `index.css`
- 화면 우하단 고정 `+` 버튼 (`position: fixed`)
- 탭 시 현재 뷰포트 중앙 좌표에 독립 루트 노드 생성 (`screenToFlowPosition` 활용)
- `zoomOnPinch: true`, `touchAction: 'none'` 적용으로 모바일 핀치 줌 및 스크롤 간섭 방지
- `store.ts`에 `addRootNode(position)` 액션 추가

#### P1 — IndexedDB 저장 상태 피드백
- **파일:** `persistence.ts`, `store.ts`, `MindMapCanvas.tsx`, `index.css`
- `SaveStatus` 타입: `'idle' | 'saving' | 'saved' | 'error'`
- `scheduleSave`에 `onStatusChange` 콜백 파라미터 추가 + try/catch 에러 처리
- store에 `saveStatus` 상태 노출, `notify()` 헬퍼로 상태 전파
- 저장됨은 2초 후 `idle`로 자동 복귀
- React Flow `Panel`(top-right)에 상태 텍스트 표시:
  - `저장 중...` (회색) / `저장됨` (초록) / `저장 실패` (빨간)

#### P2 — 노드 삭제
- **파일:** `MindMapNode.tsx`, `store.ts`, `index.css`
- 노드 선택(`selected` prop) 시 우상단에 빨간 `×` 버튼 노출
- `deleteNode(nodeId)` 액션: 대상 노드 + 모든 자식 노드(재귀) + 연결된 엣지 일괄 삭제
- `onMouseDown` stopPropagation으로 React Flow 드래그 간섭 방지

#### P3 — PC 키보드 단축키
- **파일:** `MindMapCanvas.tsx`
- 컨테이너 `div`에 `onKeyDown` + `tabIndex={0}` 적용
- `HTMLInputElement` 내 입력 중에는 단축키 비활성화 (이벤트 타겟 체크)
- 단축키 목록:

| 키 | 동작 |
|----|------|
| `Tab` | 선택된 노드의 자식 노드 추가 (오른쪽 150px) |
| `Enter` | 부모가 있으면 형제 노드 추가, 루트면 새 독립 노드 |
| `Backspace` / `Delete` | 선택된 노드 + 자손 일괄 삭제 |

---

## 5. 핵심 데이터 흐름

```
사용자 조작
    │
    ▼
MindMapCanvas / MindMapNode (이벤트 핸들러)
    │
    ▼
Zustand store (nodes, edges, saveStatus)
    │   └─ scheduleSave(mapId, nodes, edges, onStatusChange)
    │           │
    │     [500ms 디바운스]
    │           │
    │     saveMapNow() ──── IndexedDB (idb)
    │           │                nodeRepository.replaceAll()
    │           │                edgeRepository.replaceAll()
    │           └─ onStatusChange('saved' | 'error')
    │
    ▼
ReactFlow 렌더링 (nodes, edges)
    + Panel: 저장 상태 표시
    + FAB 버튼
```

---

## 6. 미구현 항목 (향후 작업)

| 항목 | 우선순위 | 비고 |
|------|---------|------|
| 대시보드 (맵 목록/생성/삭제) | 선택 | react-router-dom 추가 필요 |
| 멀티맵 지원 | 선택 | MAP_ID 현재 `'default'` 하드코딩 |
| 맵 이름 편집 | 선택 | `MapRecord.title` 필드는 스키마에 존재 |
| 오프라인 감지 UI | 선택 | navigator.onLine 활용 가능 |

---

## 7. 로컬 실행 방법

```bash
npm install
npm run dev       # http://localhost:5173
```

### 모바일 QA 체크리스트

- [ ] FAB `+` 버튼 탭 → 뷰포트 중앙에 "새 노드" 생성 확인
- [ ] 핀치 줌 동작 확인 (iOS Safari / Android Chrome)
- [ ] 노드 편집 → 새로고침 후 데이터 복구 확인 (IndexedDB)
- [ ] DevTools Network "Offline" → 편집 → 복구 확인
- [ ] 노드 선택 후 × 버튼 → 자식 노드까지 삭제 확인

### PC QA 체크리스트

- [ ] `Tab` → 자식 노드 추가
- [ ] `Enter` → 형제 노드 추가
- [ ] `Backspace` / `Delete` → 노드 삭제 (입력 중 비활성 확인)
- [ ] 저장 상태 표시 (`저장 중...` → `저장됨`)

---

## 8. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `src/pages/editor/model/persistence.ts` | `SaveStatus` 타입, `scheduleSave` 콜백/에러 처리 추가 |
| `src/pages/editor/model/store.ts` | `saveStatus`, `addRootNode`, `deleteNode` 추가; 전체 액션에 notify 콜백 적용 |
| `src/pages/editor/components/MindMapNode.tsx` | `selected` prop, 삭제 버튼 UI 추가 |
| `src/pages/editor/components/MindMapCanvas.tsx` | FAB 버튼, 터치 옵션, 키보드 단축키, 저장 상태 Panel 추가 |
| `src/index.css` | FAB, 삭제 버튼, 저장 상태 스타일 추가 |
