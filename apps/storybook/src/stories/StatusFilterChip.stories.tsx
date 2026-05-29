import type { Meta, StoryObj } from "@storybook/react";
import { StatusFilterChip } from "@todam/ui";

const meta: Meta<typeof StatusFilterChip> = {
  title: "Components/Data Display/StatusFilterChip",
  component: StatusFilterChip,
  parameters: { layout: "centered" },
  argTypes: {
    selected: { control: "boolean" },
    count: { control: "number" },
    children: { control: "text" },
  },
  args: {
    selected: true,
    count: 0,
    children: "전체",
  },
};

export default meta;
type Story = StoryObj<typeof StatusFilterChip>;

export const Playground: Story = {};

export const States: Story = {
  name: "selected 상태",
  render: () => (
    <div className="flex gap-3">
      <StatusFilterChip selected count={0}>
        전체
      </StatusFilterChip>
      <StatusFilterChip count={0}>전체</StatusFilterChip>
    </div>
  ),
};

export const FilterRow: Story = {
  name: "필터 행 예시",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusFilterChip selected count={12}>
        전체
      </StatusFilterChip>
      <StatusFilterChip count={3}>예약 확정</StatusFilterChip>
      <StatusFilterChip count={1}>건조</StatusFilterChip>
      <StatusFilterChip count={1}>초벌</StatusFilterChip>
    </div>
  ),
};
