import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "@todam/ui";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
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
type Story = StoryObj<typeof Checkbox>;

export const Playground: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked ?? false);
    return (
      <Checkbox
        {...args}
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="동의"
      />
    );
  },
};

export const On: Story = {
  name: "state / true (checked)",
  render: () => <Checkbox checked aria-label="체크됨" />,
};

export const Off: Story = {
  name: "state / false (unchecked)",
  render: () => <Checkbox checked={false} aria-label="체크 안됨" />,
};

export const Disabled: Story = {
  name: "disabled / on · off",
  render: () => (
    <div className="flex gap-4 items-center">
      <Checkbox checked disabled aria-label="체크됨 비활성" />
      <Checkbox checked={false} disabled aria-label="체크 안됨 비활성" />
    </div>
  ),
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
          <Checkbox checked aria-label="체크됨" />
          <Checkbox checked={false} aria-label="체크 안됨" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">
          disabled
        </p>
        <div className="flex gap-4 items-center">
          <Checkbox checked disabled aria-label="체크됨 비활성" />
          <Checkbox checked={false} disabled aria-label="체크 안됨 비활성" />
        </div>
      </div>
    </div>
  ),
};
