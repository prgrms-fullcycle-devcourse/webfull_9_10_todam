import { parseBusinessDocument } from './business-document-parser';

describe('parseBusinessDocument', () => {
    describe('사업자번호 추출', () => {
        it('000-00-00000 형식 사업자번호를 추출한다', () => {
            const text = '사업자 등록증\n등록번호 123-45-67890\n상호 테스트공방';
            const result = parseBusinessDocument(text);
            expect(result.businessNumber).toBe('123-45-67890');
        });

        it('사업자번호가 없으면 null을 반환한다', () => {
            const text = '사업자 등록증\n상호 테스트공방';
            const result = parseBusinessDocument(text);
            expect(result.businessNumber).toBeNull();
        });
    });

    describe('개업일자 추출 및 정규화', () => {
        it('YYYY.MM.DD 형식을 YYYYMMDD로 정규화한다', () => {
            const text = '개업연월일 2019.03.15\n상호 테스트';
            const result = parseBusinessDocument(text);
            expect(result.startDate).toBe('20190315');
        });

        it('YYYY. MM. DD (공백 포함) 형식을 YYYYMMDD로 정규화한다', () => {
            const text = '개업연월일 2021. 07. 01\n상호 테스트';
            const result = parseBusinessDocument(text);
            expect(result.startDate).toBe('20210701');
        });

        it('8자리 연속 숫자 형식을 그대로 반환한다', () => {
            const text = '개업연월일 20190315\n상호 테스트';
            const result = parseBusinessDocument(text);
            expect(result.startDate).toBe('20190315');
        });

        it('개업일자가 없으면 null을 반환한다', () => {
            const text = '사업자 등록증\n상호 테스트공방';
            const result = parseBusinessDocument(text);
            expect(result.startDate).toBeNull();
        });
    });

    describe('상호명 추출', () => {
        it('"상호(단체명)" 키워드로 상호명을 추출한다', () => {
            const text = '상호(단체명) 흙담공방\n대표자 홍길동';
            const result = parseBusinessDocument(text);
            expect(result.businessName).toBe('흙담공방');
        });

        it('"상호" 키워드로 상호명을 추출한다', () => {
            const text = '상호 흙담공방\n대표자 홍길동';
            const result = parseBusinessDocument(text);
            expect(result.businessName).toBe('흙담공방');
        });

        it('키워드 다음 줄에서 상호명을 추출한다', () => {
            const text = '상호\n흙담공방\n대표자 홍길동';
            const result = parseBusinessDocument(text);
            expect(result.businessName).toBe('흙담공방');
        });

        it('상호명이 없으면 null을 반환한다', () => {
            const text = '사업자 등록증\n123-45-67890';
            const result = parseBusinessDocument(text);
            expect(result.businessName).toBeNull();
        });
    });

    describe('대표자명 추출', () => {
        it('"성명(대표자)" 키워드로 대표자명을 추출한다', () => {
            const text = '성명(대표자) 홍길동\n상호 흙담공방';
            const result = parseBusinessDocument(text);
            expect(result.ownerName).toBe('홍길동');
        });

        it('"성명" 키워드로 대표자명을 추출한다', () => {
            const text = '성명 홍길동\n상호 흙담공방';
            const result = parseBusinessDocument(text);
            expect(result.ownerName).toBe('홍길동');
        });

        it('"대표자" 키워드로 대표자명을 추출한다', () => {
            const text = '대표자 홍길동\n상호 흙담공방';
            const result = parseBusinessDocument(text);
            expect(result.ownerName).toBe('홍길동');
        });
    });

    describe('사업장주소 추출', () => {
        it('"사업장소재지" 키워드로 주소를 추출한다', () => {
            const text = '사업장소재지 서울특별시 성동구 둑섬로 273\n상호 흙담공방';
            const result = parseBusinessDocument(text);
            expect(result.businessAddress).toBe('서울특별시 성동구 둑섬로 273');
        });

        it('"사업장" 키워드로 주소를 추출한다', () => {
            const text = '사업장\n서울특별시 성동구 둑섬로 273\n상호 흙담공방';
            const result = parseBusinessDocument(text);
            expect(result.businessAddress).toBe('서울특별시 성동구 둑섬로 273');
        });
    });

    describe('복합 실사 텍스트 파싱', () => {
        it('실제 사업자등록증 형식의 텍스트에서 모든 필드를 추출한다', () => {
            const sampleText = `사 업 자 등 록 증
등 록 번 호 : 123-45-67890
상호(단체명) 흙담공방
성명(대표자) 홍길동
개업연월일 2019.03.15
사업장소재지 서울특별시 성동구 둑섬로 273(성수동)
사업의종류 업태 서비스업  종목 공예체험`;

            const result = parseBusinessDocument(sampleText);
            expect(result.businessNumber).toBe('123-45-67890');
            expect(result.businessName).toBe('흙담공방');
            expect(result.ownerName).toBe('홍길동');
            expect(result.startDate).toBe('20190315');
            expect(result.businessAddress).toBe('서울특별시 성동구 둑섬로 273(성수동)');
        });

        it('라벨이 갉아먹힌 실제 NTS OCR 텍스트(세로 라벨 레이아웃)에서 필드를 추출한다', () => {
            // Google Vision이 세로로 쌓인 라벨 첫 글자를 분리해 읽은 실제 케이스.
            // 상호→"호:", 성명→"명:", 개업연월일→"매업연월일", 사업장소재지→"업장소재지"
            const messyText = `nts.go.kr
국세청
52525252
도로 사업자등록증
5250
(일반과세자)
등록번호 : 547-54-01006
상성개사
호: 노글리랩 (noggleelab)
명: 이은지
생년월일: 1997 년 03월 08일
매업연월일: 2025 년 05월 19일
업장소재지 : 서울특별시 영등포구 국회대로36길 6-1, 2층-J474호(당산동3가)
사업의 종류: 업태 정보통신업
2025 년 05월 20일
영등포세무서장`;

            const result = parseBusinessDocument(messyText);
            expect(result.businessNumber).toBe('547-54-01006');
            expect(result.businessName).toBe('노글리랩 (noggleelab)');
            expect(result.ownerName).toBe('이은지');
            // 생년월일(1997)·발급일(05/20)이 아닌 개업일(05/19)을 잡아야 한다
            expect(result.startDate).toBe('20250519');
            expect(result.businessAddress).toBe(
                '서울특별시 영등포구 국회대로36길 6-1, 2층-J474호(당산동3가)',
            );
        });

        it('법인 사업자등록증("상호(법인명)", 띄어쓰인 "대표 자")에서 라벨을 제거하고 값만 추출한다', () => {
            const corpText = `국세청
사업자등록증
(일반과세자)
등록번호: 123-45-67890
상호(법인명) : (주)샘플기업
대표 자: 홍길동
개업연월일: 2024년 01월 01일
법인등록번호 : 110111-1234567
사업장소재지: 서울특별시 강남구 테헤란로 123, 10층(삼성동)
사업의 종류: 업태 : 도매 및 소매업
발급일: 2024년 05월 20일`;

            const result = parseBusinessDocument(corpText);
            expect(result.businessNumber).toBe('123-45-67890');
            // "(법인명) :" 라벨은 제거하되 회사명 "(주)"는 보존
            expect(result.businessName).toBe('(주)샘플기업');
            expect(result.ownerName).toBe('홍길동');
            // 개업일(01/01)을 잡고 발급일(05/20)·법인등록번호는 무시
            expect(result.startDate).toBe('20240101');
            expect(result.businessAddress).toBe('서울특별시 강남구 테헤란로 123, 10층(삼성동)');
        });

        it('"법인명(단체명)" 라벨, 깨진 "대 Ⅱ 자", 공백 들어간 "사업장 소재지"를 처리한다', () => {
            const corpText = `사업자등록증
(법인사업자:본점)
등록번호: 123-45-67890
법인명(단체명) : (주)미래이노베이션
대 Ⅱ 자: 김찰수
개업연월일: 2023년 01월 01일 거인등록번호: 110111-1234567
사업장 소재지: 서울특별시 서초구 서초대로 123
본부 소재지 : 서울특별시 서초구 서초대로 123
사업의 증류: [업태]
발급 이유: 신규 등록
2024년 05월 15일
서초 세무서장`;

            const result = parseBusinessDocument(corpText);
            expect(result.businessNumber).toBe('123-45-67890');
            expect(result.businessName).toBe('(주)미래이노베이션');
            expect(result.ownerName).toBe('김찰수');
            expect(result.startDate).toBe('20230101');
            // "소재지:" 라벨을 떼고 주소만
            expect(result.businessAddress).toBe('서울특별시 서초구 서초대로 123');
        });

        it('일부 필드만 있는 텍스트에서 있는 필드만 추출하고 나머지는 null을 반환한다', () => {
            const partialText = `사 업 자 등 록 증
등록번호 123-45-67890
상호 흙담공방`;

            const result = parseBusinessDocument(partialText);
            expect(result.businessNumber).toBe('123-45-67890');
            expect(result.businessName).toBe('흙담공방');
            expect(result.ownerName).toBeNull();
            expect(result.startDate).toBeNull();
            expect(result.businessAddress).toBeNull();
        });
    });
});
