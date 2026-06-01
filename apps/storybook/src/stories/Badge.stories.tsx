import type { Meta, StoryObj } from "@storybook/react";
import { Badge, ClockIcon, DeliveryIcon } from "@todam/ui";

const meta: Meta<typeof Badge> = {
  title: "Components/Data Display/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    tone: {
      control: "select",
      options: [
        "info",
        "primary",
        "secondary",
        "success",
        "danger",
        "neutral",
      ],
    },
    children: { control: "text" },
  },
  args: {
    tone: "info",
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

export const Tones: Story = {
  name: "톤별",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="info" icon={<ClockIcon />}>
        info
      </Badge>
      <Badge tone="primary" icon={<ClockIcon />}>
        primary
      </Badge>
      <Badge tone="secondary" icon={<ClockIcon />}>
        secondary
      </Badge>
      <Badge tone="success" icon={<ClockIcon />}>
        success
      </Badge>
      <Badge tone="danger" icon={<ClockIcon />}>
        danger
      </Badge>
      <Badge tone="neutral" icon={<ClockIcon />}>
        neutral
      </Badge>
    </div>
  ),
};
