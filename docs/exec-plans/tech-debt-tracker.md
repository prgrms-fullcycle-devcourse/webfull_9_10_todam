# Tech Debt Tracker

## Current Debt

| 항목 | 트리거 (무엇 완성/발생 시 착수) | 출처 |
|---|---|---|
| BottomNav Zustand store 도입 | 로그인 role/session·선택공방·권한/온보딩 기반 nav 변동, 여러 widget 공유 중 하나 발생 시 | completed/bottom-navigation-hook.md |
| Header+BottomNav visible path set → shared config 분리 | 두 widget의 path set 중복 관리 부담 생길 때 | completed/header-hook.md |
| 페이지 server/client 분리 (RSC) | 페이지별 실 API 연동 시. mock 단계엔 MSW(브라우저 워커)+react-query로 데이터 fetch가 client 강제 → 분리 무의미. 실 API면 server fetch + client island(상호작용 leaf)로 전환 | issue #82 refactor 논의 |
| 헤더 우측액션 route-driven 전환 | 헤더 액션 쓰는 페이지를 RSC화할 때. 현재 `useHeaderActionStore.setAction`을 useEffect로 주입 → 액션 페이지가 client 강제됨. layout이 route segment/params 보고 헤더 구성하도록 바꾸면 세금 제거 | issue #82 refactor 논의 |
