#!/usr/bin/env node
// 폰 실기 테스트 헬퍼.
//  1) cloudflare quick tunnel 2개(web/api) 실행 → https URL 발급
//  2) .env.mobile 의 계정으로 로컬 API 로그인 → accessToken 발급
//  3) /dev-login URL(hash 에 token+apiBase) 생성 → 터미널에 QR 출력
// 폰으로 QR 스캔하면 토큰이 주입된 채 앱이 열린다.
//
// 사전조건: cloudflared 설치, `pnpm web`/`pnpm api` 가 이미 실행 중.
// 설정: repo 루트 .env.test (gitignore) 에
//   TODAM_DEV_EMAIL=partner@example.com
//   TODAM_DEV_PASSWORD=...
//   (선택) TODAM_WEB_PORT=3000  TODAM_API_PORT=4000  TODAM_NEXT=/partner/stores

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// web dev 라우트(/dev-login/token)가 읽는 토큰 파일. cwd(apps/web) 기준 .dev-login.json.
const TOKEN_FILE = join(ROOT, 'apps/web/.dev-login.json');

// ── .env.mobile 로드 (단순 파서, process.env 가 우선) ──────────────
function loadEnvFile(path) {
    if (!existsSync(path)) return;
    for (const raw of readFileSync(path, 'utf8').split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        const val = line.slice(eq + 1).trim();
        if (!(key in process.env)) process.env[key] = val;
    }
}
loadEnvFile(join(ROOT, '.env.test'));

const EMAIL = process.env.TODAM_DEV_EMAIL;
const PASSWORD = process.env.TODAM_DEV_PASSWORD;
const WEB_PORT = process.env.TODAM_WEB_PORT || '3000';
const API_PORT = process.env.TODAM_API_PORT || '4000';
const NEXT_PATH = process.env.TODAM_NEXT || '/partner/stores';

if (!EMAIL || !PASSWORD) {
    console.error(
        '✗ TODAM_DEV_EMAIL / TODAM_DEV_PASSWORD 가 필요합니다. 루트에 .env.test 를 만들거나 env 로 전달하세요.',
    );
    process.exit(1);
}

const children = [];
function cleanup() {
    for (const c of children) {
        try {
            c.kill('SIGTERM');
        } catch {
            /* noop */
        }
    }
    try {
        rmSync(TOKEN_FILE, { force: true });
    } catch {
        /* noop */
    }
}
process.on('SIGINT', () => {
    console.log('\n종료합니다…');
    cleanup();
    process.exit(0);
});
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 로컬 API 로그인 → accessToken ────────────────────────────────
// 연결 실패(api 부팅 전)는 retriable, 인증 실패(잘못된 계정)는 즉시 throw.
async function login() {
    const url = `http://localhost:${API_PORT}/auth/login`;
    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        });
    } catch {
        const e = new Error(`API(${url}) 연결 안 됨`);
        e.retriable = true;
        throw e;
    }
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.data?.accessToken) {
        throw new Error(`로그인 실패(${res.status}): ${json?.message ?? '응답에 accessToken 없음'}`);
    }
    return json.data.accessToken;
}

// api 부팅 대기 겸 로그인 재시도(`pnpm all` 동시 실행 시 순서 무관 보장).
async function loginWithRetry(timeoutMs = 120_000) {
    const start = Date.now();
    let lastErr;
    while (Date.now() - start < timeoutMs) {
        try {
            return await login();
        } catch (e) {
            if (!e.retriable) throw e; // 인증 실패 등은 즉시 종료
            lastErr = e;
            console.log('  …API 부팅 대기 중 (재시도)');
            await sleep(2500);
        }
    }
    throw lastErr ?? new Error('로그인 타임아웃');
}

async function main() {
    console.log('▶ tunnel 시작 중… (cloudflared)');
    const [webUrl, apiUrl] = await Promise.all([
        startTunnel('web', WEB_PORT),
        startTunnel('api', API_PORT),
    ]);

    console.log('▶ 로그인 중…');
    const token = await loginWithRetry();
    console.log('✓ accessToken 발급 완료');

    // 토큰은 QR/URL 에 넣지 않고 로컬 파일에 기록 → web 라우트가 nonce 로 조회.
    // (QR 데이터 = nonce 만 → 작게 유지. 토큰이 URL·히스토리·외부에 안 남음)
    const nonce = randomUUID();
    writeFileSync(TOKEN_FILE, JSON.stringify({ nonce, token, api: apiUrl, next: NEXT_PATH }));

    const params = new URLSearchParams({ n: nonce }).toString();
    const devUrl = `${webUrl}/dev-login?${params}`;

    let qr = null;
    try {
        qr = (await import('qrcode-terminal')).default;
    } catch {
        /* 미설치 시 URL 만 출력 */
    }

    console.log('\n────────────────────────────────────────────');
    console.log('폰에서 아래 QR 스캔 (토큰 자동 주입):');
    console.log('────────────────────────────────────────────\n');
    if (qr) qr.generate(devUrl, { small: true });
    else console.log('(QR 보려면 `pnpm add -Dw qrcode-terminal`)');
    console.log('\nURL:', devUrl);
    console.log('앱 접속용(토큰 없이):', webUrl);
    console.log('\nCtrl+C 로 종료 (tunnel·토큰파일 정리)\n');
}

main().catch((e) => {
    console.error('✗', e.message);
    cleanup();
    process.exit(1);
});
