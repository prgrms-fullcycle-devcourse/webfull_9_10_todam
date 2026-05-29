import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBarWrapper } from "@todam/ui";

const meta: Meta<typeof ProgressBarWrapper> = {
  title: "Components/ProgressBarWrapper",
  component: ProgressBarWrapper,
  parameters: { layout: "padded" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    size: { control: "radio", options: ["sm", "lg"] },
    leftLabel: { control: "text" },
    rightLabel: { control: "text" },
  },
  args: {
    value: 80,
    size: "sm",
    leftLabel: "진행률",
    rightLabel: "80%",
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
type Story = StoryObj<typeof ProgressBarWrapper>;

export const Playground: Story = {};

export const WithLabels: Story = {
  name: "라벨 (양끝)",
  render: () => (
    <ProgressBarWrapper value={80} leftLabel="진행률" rightLabel="80%" />
  ),
};

export const NoLabel: Story = {
  name: "라벨 없음",
  render: () => <ProgressBarWrapper value={80} />,
};

export const Steps: Story = {
  name: "진행률 단계",
  render: () => (
    <div className="flex flex-col gap-6">
      {[25, 50, 75, 100].map((v) => (
        <ProgressBarWrapper
          key={v}
          value={v}
          leftLabel="단계"
          rightLabel={`${v}%`}
        />
      ))}
    </div>
  ),
};
