import type { Meta, StoryObj } from "@storybook/react";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  NametagIcon,
  FlagIcon,
} from "@todam/ui";
import { ResultTable } from "../../../web/src/shared/ui";

const meta: Meta<typeof ResultTable> = {
  title: "Components/ResultTable",
  component: ResultTable,
  parameters: { layout: "centered" },
  argTypes: {
    title: { control: "text" },
    storeName: { control: "text" },
    location: { control: "text" },
  },
  args: {
    title: "className",
    storeName: "storeName",
    location: "location",
  },
};

export default meta;
type Story = StoryObj<typeof ResultTable>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 328 }}>
      <ResultTable {...args} />
    </div>
  ),
};

export const WithRows: Story = {
  name: "여러 td",
  render: () => (
    <div style={{ width: 328 }}>
      <ResultTable
        title="className"
        storeName="storeName"
        location="location"
        rows={[
          { icon: <CalendarIcon size={16} />, label: "날짜", value: "2026.05.29" },
          { icon: <ClockIcon size={16} />, label: "시간", value: "14:00" },
          { icon: <UserIcon size={16} />, label: "인원", value: "4명" },
          { icon: <NametagIcon size={16} />, label: "예약자", value: "홍길동" },
          { icon: <FlagIcon size={16} />, label: "상태", value: "확정" },
        ]}
      />
    </div>
  ),
};
