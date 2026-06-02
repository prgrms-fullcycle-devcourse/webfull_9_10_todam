import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "@todam/ui";

const meta: Meta<typeof Pagination> = {
  title: "Components/Data Display/Pagination",
  component: Pagination,
  parameters: { layout: "centered" },
  argTypes: {
    count: { control: { type: "number", min: 1, max: 10, step: 1 } },
    activeIndex: { control: { type: "number", min: 0, max: 9, step: 1 } },
  },
  args: {
    count: 4,
    activeIndex: 0,
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Playground: Story = {};

export const Steps: Story = {
  name: "활성 위치별",
  render: () => (
    <div className="flex flex-col gap-4">
      {[0, 1, 2, 3].map((active) => (
        <Pagination key={active} count={4} activeIndex={active} />
      ))}
    </div>
  ),
};
