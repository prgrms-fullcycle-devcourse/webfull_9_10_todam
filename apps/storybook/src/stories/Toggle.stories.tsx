import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Toggle } from "@todam/ui";

const meta: Meta<typeof Toggle> = {
  title: "Components/Form/Toggle",
  component: Toggle,
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
type Story = StoryObj<typeof Toggle>;

export const Playground: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked ?? false);
    return (
      <Toggle
        {...args}
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="알림 토글"
      />
    );
  },
};

export const On: Story = {
  name: "state / true (on)",
  render: () => <Toggle checked aria-label="켜짐" />,
};

export const Off: Story = {
  name: "state / false (off)",
  render: () => <Toggle checked={false} aria-label="꺼짐" />,
};

export const Disabled: Story = {
  name: "disabled / on · off",
  render: () => (
    <div className="flex gap-4 items-center">
      <Toggle checked disabled aria-label="켜짐 비활성" />
      <Toggle checked={false} disabled aria-label="꺼짐 비활성" />
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
          <Toggle checked aria-label="켜짐" />
          <Toggle checked={false} aria-label="꺼짐" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">
          disabled
        </p>
        <div className="flex gap-4 items-center">
          <Toggle checked disabled aria-label="켜짐 비활성" />
          <Toggle checked={false} disabled aria-label="꺼짐 비활성" />
        </div>
      </div>
    </div>
  ),
};
