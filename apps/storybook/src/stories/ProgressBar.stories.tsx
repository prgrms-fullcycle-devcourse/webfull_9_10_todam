import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "@todam/ui";

const meta: Meta<typeof ProgressBar> = {
  title: "Components/Data Display/ProgressBar",
  component: ProgressBar,
  parameters: { layout: "padded" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    size: { control: "radio", options: ["sm", "lg"] },
  },
  args: {
    value: 60,
    size: "lg",
  },
  decorators: [
    (Story) => (
      <div className="w-[312px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Playground: Story = {};

export const Sm: Story = {
  name: "sm",
  render: () => <ProgressBar size="sm" value={60} />,
};

export const Lg: Story = {
  name: "lg",
  render: () => <ProgressBar size="lg" value={60} />,
};

export const Values: Story = {
  name: "진행률 단계",
  render: () => (
    <div className="flex flex-col gap-4">
      {[0, 25, 50, 75, 100].map((value) => (
        <div key={value} className="flex flex-col gap-1">
          <p className="text-xs font-mono text-foreground-tertiary">{value}%</p>
          <ProgressBar size="lg" value={value} />
        </div>
      ))}
    </div>
  ),
};

export const SizeCompare: Story = {
  name: "size 비교",
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">sm</p>
        <ProgressBar size="sm" value={60} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">lg</p>
        <ProgressBar size="lg" value={60} />
      </div>
    </div>
  ),
};
