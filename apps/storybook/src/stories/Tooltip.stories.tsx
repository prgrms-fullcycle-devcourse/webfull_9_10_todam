import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "@todam/ui";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Feedback/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
  },
  args: {
    title: "Tooltip Title",
    description: "Tooltip Description",
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Playground: Story = {};

export const TitleAndDescription: Story = {
  name: "title + description",
  render: () => (
    <Tooltip title="Tooltip Title" description="Tooltip Description" />
  ),
};

export const TitleOnly: Story = {
  name: "title only",
  render: () => <Tooltip title="저장되었습니다" />,
};

export const LongText: Story = {
  name: "긴 내용 (max-width)",
  render: () => (
    <Tooltip
      title="알림"
      description="내용이 길어지면 최대 너비(400px)까지 늘어난 뒤 줄바꿈됩니다. 한 줄에 들어가지 않는 설명도 자연스럽게 처리됩니다."
    />
  ),
};
