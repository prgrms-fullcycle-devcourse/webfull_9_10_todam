import type { Meta, StoryObj } from "@storybook/react";
import { SpaceBlock } from "@todam/ui";

const meta: Meta<typeof SpaceBlock> = {
  title: "Components/SpaceBlock",
  component: SpaceBlock,
  parameters: { layout: "centered" },
  argTypes: {
    size: {
      control: "radio",
      options: [4, 8, 16, 20],
    },
  },
  args: {
    size: 4,
  },
};

export default meta;
type Story = StoryObj<typeof SpaceBlock>;

export const Playground: Story = {};

export const AllSizes: Story = {
  name: "전체 size 비교",
  render: () => (
    <div className="flex flex-col w-48">
      {([4, 8, 16, 20] as const).map((size) => (
        <div key={size}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>size={size}</div>
          <div style={{ background: "#e5e7eb", width: "100%" }}>
            <SpaceBlock size={size} />
          </div>
          <div style={{ height: 12 }} />
        </div>
      ))}
    </div>
  ),
};
