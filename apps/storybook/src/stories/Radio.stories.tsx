import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Radio } from "@todam/ui";

const meta: Meta<typeof Radio> = {
  title: "Components/Form/Radio",
  component: Radio,
  parameters: { layout: "centered" },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    checked: true,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const Playground: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked ?? false);
    return (
      <Radio
        {...args}
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="선택"
      />
    );
  },
};

export const On: Story = {
  name: "state / true (selected)",
  render: () => <Radio checked aria-label="선택됨" />,
};

export const Off: Story = {
  name: "state / false (unselected)",
  render: () => <Radio checked={false} aria-label="선택 안됨" />,
};

export const Disabled: Story = {
  name: "disabled / on · off",
  render: () => (
    <div className="flex gap-4 items-center">
      <Radio checked disabled aria-label="선택됨 비활성" />
      <Radio checked={false} disabled aria-label="선택 안됨 비활성" />
    </div>
  ),
};

export const Group: Story = {
  name: "그룹 선택 예시",
  render: () => {
    const options = ["옵션 A", "옵션 B", "옵션 C"];
    const [selected, setSelected] = useState("옵션 A");
    return (
      <div className="flex flex-col gap-3" role="radiogroup">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <Radio
              checked={selected === option}
              onCheckedChange={() => setSelected(option)}
              aria-label={option}
            />
            <span className="text-foreground">{option}</span>
          </label>
        ))}
      </div>
    );
  },
};

export const AllStates: Story = {
  name: "전체 상태 비교",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-background min-w-[320px]">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">
          default
        </p>
        <div className="flex gap-4 items-center">
          <Radio checked aria-label="선택됨" />
          <Radio checked={false} aria-label="선택 안됨" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">
          disabled
        </p>
        <div className="flex gap-4 items-center">
          <Radio checked disabled aria-label="선택됨 비활성" />
          <Radio checked={false} disabled aria-label="선택 안됨 비활성" />
        </div>
      </div>
    </div>
  ),
};
