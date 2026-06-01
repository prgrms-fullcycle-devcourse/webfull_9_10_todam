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
