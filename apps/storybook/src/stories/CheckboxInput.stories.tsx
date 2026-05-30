import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button, CheckboxInput } from "@todam/ui";

const meta: Meta<typeof CheckboxInput> = {
  title: "Components/Form/CheckboxInput",
  component: CheckboxInput,
  parameters: { layout: "padded" },
  argTypes: {
    label: { control: "text" },
    checked: { control: "boolean" },
    bordered: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "주차 가능",
    checked: false,
    bordered: false,
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
type Story = StoryObj<typeof CheckboxInput>;

export const Playground: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked ?? false);
    return <CheckboxInput {...args} checked={checked} onCheckedChange={setChecked} />;
  },
};

export const NoBorder: Story = {
  name: "bordered=False (기본)",
  render: () => <CheckboxInput label="와이파이" />,
};

export const Bordered: Story = {
  name: "bordered=True",
  render: () => <CheckboxInput label="와이파이" bordered />,
};

export const WithAction: Story = {
  name: "우측 액션 슬롯",
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <CheckboxInput
        label="이용약관 동의"
        bordered
        checked={checked}
        onCheckedChange={setChecked}
        action={
          <Button variant="ghost" layout="onlyLabel" size="sm">
            보기
          </Button>
        }
      />
    );
  },
};

const amenities = ["주차 가능", "반려동물 동반", "와이파이"];

export const Group: Story = {
  name: "체크박스 그룹",
  render: () => {
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    return (
      <div className="flex flex-col gap-2">
        {amenities.map((a) => (
          <CheckboxInput
            key={a}
            label={a}
            bordered
            checked={selected[a] ?? false}
            onCheckedChange={(v) => setSelected((p) => ({ ...p, [a]: v }))}
          />
        ))}
      </div>
    );
  },
};
