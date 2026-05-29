import type { Meta, StoryObj } from "@storybook/react";
import { StepperItem } from "@todam/ui";

const meta: Meta<typeof StepperItem> = {
  title: "Components/StepperItem",
  component: StepperItem,
  parameters: { layout: "centered" },
  argTypes: {
    status: { control: "radio", options: ["completed", "current", "upcoming"] },
    isLast: { control: "boolean" },
  },
  args: {
    status: "current",
    isLast: false,
  },
  decorators: [
    (Story) => (
      <div className="flex h-24">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StepperItem>;

export const Playground: Story = {};

export const AllStatus: Story = {
  name: "status별 (커넥터)",
  render: () => (
    <div className="flex h-24 gap-8">
      {(["completed", "current", "upcoming"] as const).map((status) => (
        <div key={status} className="flex flex-col items-center gap-2">
          <StepperItem status={status} />
          <span className="text-xs text-foreground-tertiary">{status}</span>
        </div>
      ))}
    </div>
  ),
};

const steps = [
  { status: "completed" as const, title: "체험 신청" },
  { status: "completed" as const, title: "방문 예약" },
  { status: "current" as const, title: "체험 진행" },
  { status: "upcoming" as const, title: "체험 완료" },
];

export const VerticalStepper: Story = {
  name: "세로 스테퍼 조합",
  parameters: { layout: "padded" },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col bg-background p-6">
      {steps.map((step, i) => (
        <div key={step.title} className="flex gap-3">
          <StepperItem status={step.status} isLast={i === steps.length - 1} />
          <div className="pb-8">
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            <p className="text-xs text-foreground-tertiary">단계 설명 텍스트</p>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const IsLast: Story = {
  name: "isLast (커넥터 없음)",
  render: () => (
    <div className="flex h-24 gap-8">
      <div className="flex flex-col items-center gap-2">
        <StepperItem status="completed" isLast />
        <span className="text-xs text-foreground-tertiary">isLast</span>
      </div>
    </div>
  ),
};
