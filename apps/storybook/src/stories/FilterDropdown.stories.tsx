import type { Meta, StoryObj } from "@storybook/react";
import { FilterDropdown, StatusIcon } from "@todam/ui";

const meta: Meta<typeof FilterDropdown> = {
  title: "Components/FilterDropdown",
  component: FilterDropdown,
  parameters: { layout: "centered" },
  argTypes: {
    children: { control: "text" },
  },
  args: {
    children: "전체",
  },
};

export default meta;
type Story = StoryObj<typeof FilterDropdown>;

export const Playground: Story = {
  render: (args) => <FilterDropdown {...args} icon={<StatusIcon />} />,
};

export const WithIcon: Story = {
  name: "아이콘 포함",
  render: () => <FilterDropdown icon={<StatusIcon />}>전체</FilterDropdown>,
};
