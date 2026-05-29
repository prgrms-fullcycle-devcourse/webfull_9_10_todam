import type { Preview } from "@storybook/react";
import "../src/styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          "Design System",
          ["Colors", "Icons"],
          "Components",
          ["Form", "Data Display", "Feedback", "Layout"],
        ],
      },
    },
  },
  decorators: [
    (Story) => {
      document.body.classList.add("bg-background");
      return Story();
    },
  ],
};

export default preview;
