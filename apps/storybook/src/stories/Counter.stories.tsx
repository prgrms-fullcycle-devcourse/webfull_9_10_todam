import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Counter } from "@todam/ui";

const meta: Meta<typeof Counter> = {
  title: "Components/Form/Counter",
  component: Counter,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Counter>;

export const Playground: Story = {
  render: () => {
    const [value, setValue] = useState(1);
    return <Counter value={value} onChange={setValue} min={0} />;
  },
};

export const WithMax: Story = {
  name: "min·max 경계",
  render: () => {
    const [value, setValue] = useState(4);
    return <Counter value={value} onChange={setValue} min={1} max={10} />;
  },
};

export const Disabled: Story = {
  name: "비활성",
  render: () => <Counter value={3} onChange={() => {}} disabled />,
};
