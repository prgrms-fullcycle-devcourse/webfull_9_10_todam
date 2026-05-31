import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "@todam/ui";

const meta: Meta<typeof Divider> = {
  title: "Components/Layout/Divider",
  component: Divider,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 300 }}>
      <div style={{ padding: "12px 0", textAlign: "center" }}>위 콘텐츠</div>
      <Divider />
      <div style={{ padding: "12px 0", textAlign: "center" }}>아래 콘텐츠</div>
    </div>
  ),
};
