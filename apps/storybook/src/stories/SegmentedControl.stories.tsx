import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SegmentedControl } from "@todam/ui";

const OPTIONS = ["Label", "Label", "Label", "Label"];

const meta: Meta<typeof SegmentedControl> = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[370px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Playground: Story = {
  render: () => {
    const [selected, setSelected] = useState(0);
    return (
      <SegmentedControl
        options={["전체", "진행중", "완료", "취소"]}
        selected={selected}
        onSelectedChange={setSelected}
      />
    );
  },
};

export const Selected0: Story = {
  name: "selected / 0",
  render: () => <SegmentedControl options={OPTIONS} selected={0} />,
};

export const Selected1: Story = {
  name: "selected / 1",
  render: () => <SegmentedControl options={OPTIONS} selected={1} />,
};

export const Selected2: Story = {
  name: "selected / 2",
  render: () => <SegmentedControl options={OPTIONS} selected={2} />,
};

export const Selected3: Story = {
  name: "selected / 3",
  render: () => <SegmentedControl options={OPTIONS} selected={3} />,
};

export const TwoOptions: Story = {
  name: "옵션 2개",
  render: () => {
    const [selected, setSelected] = useState(0);
    return (
      <SegmentedControl
        options={["월간", "연간"]}
        selected={selected}
        onSelectedChange={setSelected}
      />
    );
  },
};

export const AllVariants: Story = {
  name: "전체 selected 비교",
  parameters: { layout: "padded" },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-4 p-8 bg-background w-[420px]">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex flex-col gap-1">
          <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">
            selected = {index}
          </p>
          <SegmentedControl options={OPTIONS} selected={index} />
        </div>
      ))}
    </div>
  ),
};
