'use client';

// 모바일(iOS Safari 등)은 user gesture 밖에서 input.focus()를 해도 키보드를 올리지 않는다.
// 검색 탭을 누르는 제스처 안에서 임시 input에 미리 focus를 줘 키보드를 띄워 두면,
// Next의 client-side 네비게이션(같은 document)으로 검색 페이지에 도착했을 때
// 실제 검색 input이 focus를 이어받아 키보드가 유지된다(focus-relay).
//
// 데스크탑/마우스 환경에선 검색 페이지의 autoFocus만으로 충분하므로 동작하지 않게 한다.

let primer: HTMLInputElement | null = null;

export function primeMobileKeyboard() {
    if (typeof window === 'undefined') return;
    // coarse 포인터(터치)에서만 — 데스크탑에선 불필요하고 깜빡임만 유발.
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;
    if (primer) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('aria-hidden', 'true');
    input.tabIndex = -1;
    // 화면 밖·비가시. font-size 16px는 iOS focus 줌 방지(보이진 않지만 일관성).
    input.style.cssText =
        'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;pointer-events:none;';
    document.body.appendChild(input);
    input.focus();
    primer = input;
}

// 검색 페이지 실 input이 focus를 가져간 뒤 호출 — 임시 input 정리.
export function releaseMobileKeyboardPrimer() {
    if (!primer) return;
    primer.remove();
    primer = null;
}
