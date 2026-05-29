import type { Meta, StoryObj } from "@storybook/react";
import { ClockIcon, CalendarIcon, UserIcon } from "@todam/ui";
import { InfoTable } from "../../../web/src/shared/ui";

const meta: Meta<typeof InfoTable> = {
  title: "Components/InfoTable",
  component: InfoTable,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof InfoTable>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 348 }}>
      <InfoTable {...args} />
    </div>
  ),
};

export const WithRows: Story = {
  name: "여러 td",
  render: () => (
    <div style={{ width: 348 }}>
      <InfoTable
        rows={[
          { icon: <CalendarIcon size={16} />, label: "날짜", value: "2026.05.29" },
          { icon: <ClockIcon size={16} />, label: "시간", value: "14:00" },
          { icon: <UserIcon size={16} />, label: "인원", value: "4명" },
        ]}
      />
    </div>
  ),
};
