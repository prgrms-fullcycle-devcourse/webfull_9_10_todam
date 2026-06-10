// 작성자명 마스킹 공용 util.
// 앞 3글자만 노출, 나머지는 길이만큼 '*'.
// 3글자 이하면 첫 글자만 노출하고 나머지 '*' (최소 1개). 빈 문자열이면 '*'.
export function maskNickname(nickname: string): string {
    const name = nickname ?? '';
    if (name.length === 0) {
        return '*';
    }
    if (name.length <= 3) {
        const visible = name.slice(0, 1);
        return visible + '*'.repeat(Math.max(name.length - 1, 1));
    }
    const visible = name.slice(0, 3);
    return visible + '*'.repeat(name.length - 3);
}
