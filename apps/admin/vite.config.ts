import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 3001,
    },
    // 워크스페이스 패키지는 소스(.ts/.tsx)를 직접 export → esbuild가 사전번들하도록 강제.
    optimizeDeps: {
        include: ['@todam/ui', '@todam/shared'],
    },
});
