import type { Meta, StoryObj } from "@storybook/react";
import { StepperIcon } from "@todam/ui";

const meta: Meta<typeof StepperIcon> = {
  title: "Components/StepperIcon",
  component: StepperIcon,
  parameters: { layout: "centered" },
  argTypes: {
    shape: { control: "radio", options: ["square", "circle"] },
    status: { control: "radio", options: ["completed", "current", "upcoming"] },
  },
  args: {
    shape: "circle",
    status: "current",
  },
};

export default meta;
type Story = StoryObj<typeof StepperIcon>;

export const Playground: Story = {};

export const Circle: Story = {
  name: "circle",
  render: () => (
    <div className="flex items-center gap-4">
      <StepperIcon shape="circle" status="completed" />
      <StepperIcon shape="circle" status="current" />
      <StepperIcon shape="circle" status="upcoming" />
    </div>
  ),
};

export const Square: Story = {
  name: "square",
  render: () => (
    <div className="flex items-center gap-4">
      <StepperIcon shape="square" status="completed" />
      <StepperIcon shape="square" status="current" />
      <StepperIcon shape="square" status="upcoming" />
    </div>
  ),
};

export const AllVariants: Story = {
  name: "전체 variant",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-background">
      {(["circle", "square"] as const).map((shape) => (
        <div key={shape} className="flex flex-col gap-3">
          <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">{shape}</p>
          <div className="flex items-center gap-4">
            {(["completed", "current", "upcoming"] as const).map((status) => (
              <div key={status} className="flex flex-col items-center gap-2">
                <StepperIcon shape={shape} status={status} />
                <span className="text-xs text-foreground-tertiary">{status}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
