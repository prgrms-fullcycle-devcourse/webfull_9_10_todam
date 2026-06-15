#!/usr/bin/env node
// 폰 실기 테스트 헬퍼 — prod 와 동일 흐름.
//   cloudflare quick tunnel(web) 실행 → https URL/QR 출력.
//   폰에서 열어 일반 로그인(메모리 access token + HttpOnly refresh 쿠키, 프록시 경유).
//   web 서버가 로컬에서 proxy → 로컬 API 로 전달하므로 api 터널·토큰주입 불필요.
//
// 사전조건: cloudflared 설치, `pnpm web`(+ `pnpm api`) 또는 `pnpm all` 실행.
// (선택) TODAM_WEB_PORT=3000

import { spawn } from 'node:child_process';

const WEB_PORT = process.env.TODAM_WEB_PORT || '3000';

const children = [];
function cleanup() {
    for (const c of children) {
        try {
            c.kill('SIGTERM');
        } catch {
            /* noop */
        }
    }
}
// SIGINT(Ctrl+C 단독) + SIGTERM(concurrently/`pnpm all` 종료) 모두 정리.
// SIGTERM 미처리 시 cleanup 안 돌아 cloudflared 가 orphan 으로 남는다.
for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
        console.log(`\n종료합니다… (${sig})`);
        cleanup();
        process.exit(0);
    });
}
process.on('exit', cleanup);

// ── cloudflared quick tunnel 시작 → 첫 https URL 반환 ──────────────
function startTunnel(label, port) {
    return new Promise((resolve, reject) => {
        const proc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        children.push(proc);
        let settled = false;
        const onData = (buf) => {
            const m = String(buf).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
            if (m && !settled) {
                settled = true;
                console.log(`✓ [${label}] tunnel: ${m[0]}`);
                resolve(m[0]);
            }
        };
        proc.stdout.on('data', onData);
        proc.stderr.on('data', onData);
        proc.on('error', (e) => {
            if (e.code === 'ENOENT')
                reject(new Error('cloudflared 미설치. `brew install cloudflared` 후 다시 실행.'));
            else reject(e);
        });
        proc.on('exit', (code) => {
            if (!settled) reject(new Error(`[${label}] tunnel 종료(code ${code})`));
        });
        setTimeout(() => {
            if (!settled) reject(new Error(`[${label}] tunnel URL 타임아웃(30s)`));
        }, 30_000);
    });
}

async function main() {
    console.log('▶ tunnel 시작 중… (cloudflared)');
    const webUrl = await startTunnel('web', WEB_PORT);

    let qr = null;
    try {
        qr = (await import('qrcode-terminal')).default;
    } catch {
        /* 미설치 시 URL 만 출력 */
    }

    console.log('\n────────────────────────────────────────────');
    console.log('폰에서 아래 QR 스캔 후 일반 로그인:');
    console.log('────────────────────────────────────────────\n');
    if (qr) qr.generate(webUrl, { small: true });
    else console.log('(QR 보려면 `pnpm add -Dw qrcode-terminal`)');
    console.log('\nURL:', webUrl);
    console.log('\nCtrl+C 로 종료 (tunnel 정리)\n');
}

main().catch((e) => {
    console.error('✗', e.message);
    cleanup();
    process.exit(1);
});
