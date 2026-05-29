import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RadioInput } from "@todam/ui";

const meta: Meta<typeof RadioInput> = {
  title: "Components/Form/RadioInput",
  component: RadioInput,
  parameters: { layout: "padded" },
  argTypes: {
    selected: { control: "boolean" },
    title: { control: "text" },
    description: { control: "text" },
  },
  args: {
    title: "기본 배송",
    description: "2~3일 소요",
    selected: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[328px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RadioInput>;

export const Playground: Story = {
  render: (args) => {
    const [selected, setSelected] = useState(args.selected ?? false);
    return (
      <RadioInput
        {...args}
        selected={selected}
        onSelect={() => setSelected(true)}
      />
    );
  },
};

export const Selected: Story = {
  name: "selected=True",
  render: () => <RadioInput title="기본 배송" description="2~3일 소요" selected />,
};

export const Unselected: Story = {
  name: "selected=False",
  render: () => <RadioInput title="기본 배송" description="2~3일 소요" />,
};

const options = [
  { title: "기본 배송", description: "2~3일 소요" },
  { title: "빠른 배송", description: "당일 도착" },
  { title: "방문 수령", description: "공방에서 직접" },
];

export const Group: Story = {
  name: "라디오 그룹",
  render: () => {
    const [active, setActive] = useState(0);
    return (
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => (
          <RadioInput
            key={opt.title}
            title={opt.title}
            description={opt.description}
            selected={active === i}
            onSelect={() => setActive(i)}
          />
        ))}
      </div>
    );
  },
};
