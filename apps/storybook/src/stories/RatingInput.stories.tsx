import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RatingInput } from "@todam/ui";

const meta: Meta<typeof RatingInput> = {
  title: "Components/Inputs/RatingInput",
  component: RatingInput,
  parameters: { layout: "centered" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 5, step: 1 } },
    size: { control: { type: "number" } },
    disabled: { control: { type: "boolean" } },
    onChange: { action: "change" },
  },
  args: {
    value: 0,
    size: 36,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof RatingInput>;

// controlled 동작 확인용 — 클릭/키보드(←→↑↓·Home·End)로 값 변경, hover 프리뷰.
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex flex-col items-center gap-3">
        <RatingInput {...args} value={value} onChange={setValue} />
        <span className="text-sm text-foreground-tertiary">
          선택: {value || "없음"}
        </span>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { value: 3, disabled: true },
  render: (args) => <RatingInput {...args} onChange={() => {}} />,
};
