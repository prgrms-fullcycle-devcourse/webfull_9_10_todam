import type { Meta, StoryObj } from "@storybook/react";
import { Rating } from "@todam/ui";

const meta: Meta<typeof Rating> = {
  title: "Components/Data Display/Rating",
  component: Rating,
  parameters: { layout: "centered" },
  argTypes: {
    scope: { control: { type: "range", min: 0, max: 5, step: 1 } },
  },
  args: {
    scope: 3,
  },
};

export default meta;
type Story = StoryObj<typeof Rating>;

export const Playground: Story = {};

export const Scopes: Story = {
  name: "scope 1~5",
  render: () => (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((scope) => (
        <div key={scope} className="flex items-center gap-3">
          <span className="w-4 text-xs text-foreground-tertiary">{scope}</span>
          <Rating scope={scope} />
        </div>
      ))}
    </div>
  ),
};
