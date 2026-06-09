import { SearchClient } from './_components/SearchClient';

// 서버 컴포넌트. 클라이언트 동작(검색창/자동완성/결과/최근검색어)은 SearchClient로 캡슐화.
export default function SearchPage() {
    return <SearchClient />;
}
