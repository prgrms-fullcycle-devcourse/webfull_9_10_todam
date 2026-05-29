import type { Meta, StoryObj } from "@storybook/react";
import { Tag } from "@todam/ui";

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  component: Tag,
  parameters: { layout: "centered" },
  argTypes: {
    children: { control: "text" },
  },
  args: {
    children: "category",
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Playground: Story = {};

export const Examples: Story = {
  name: "예시",
  render: () => (
    <div className="flex gap-2">
      <Tag>category</Tag>
      <Tag>도자기</Tag>
      <Tag>체험</Tag>
    </div>
  ),
};
