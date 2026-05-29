import type { Meta, StoryObj } from "@storybook/react";
import { Badge, DeliveryIcon } from "@todam/ui";

const meta: Meta<typeof Badge> = {
  title: "Components/Data Display/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    children: { control: "text" },
  },
  args: {
    children: "status",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {
  render: (args) => <Badge {...args} icon={<DeliveryIcon />} />,
};

export const WithIcon: Story = {
  name: "아이콘 포함",
  render: () => <Badge icon={<DeliveryIcon />}>status</Badge>,
};

export const TextOnly: Story = {
  name: "텍스트만",
  render: () => <Badge>status</Badge>,
};
