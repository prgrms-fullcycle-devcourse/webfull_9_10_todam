import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    config.resolve = {
      ...config.resolve,
      dedupe: ["react", "react-dom", "framer-motion"],
    };
    // apps/web 소스는 Next 전제로 React import 없이 JSX 사용(jsx: preserve).
    // Storybook vite root(apps/storybook) 밖이라 plugin-react를 거치지 못하고
    // esbuild fallback으로 변환되는데, 기본 jsx=classic이라 "React is not defined"가
    // 발생한다. esbuild jsx를 automatic 런타임으로 강제해 해결한다.
    config.esbuild = {
      ...config.esbuild,
      jsx: "automatic",
    };
    // apps/web가 next/image를 쓰는데, next/image 클라이언트 번들은 process.env를
    // 참조한다. Storybook(브라우저)엔 process가 없어 "process is not defined"가
    // 발생하므로 빈 객체로 정의해준다.
    config.define = {
      ...config.define,
      "process.env": "{}",
    };
    // "use client" 지시어는 RSC 전용. Storybook(Vite/Rollup) 번들엔 무의미해
    // 무시되며 경고만 발생하므로 MODULE_LEVEL_DIRECTIVE 경고를 묵음 처리한다.
    config.build = {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        onwarn(warning, defaultHandler) {
          // 두 경고 모두 "use client" 지시어(1:0) 위치 처리에서 비롯됨.
          if (
            warning.code === "MODULE_LEVEL_DIRECTIVE" ||
            warning.code === "SOURCEMAP_ERROR"
          )
            return;
          defaultHandler(warning);
        },
      },
    };
    return config;
  },
};

export default config;
