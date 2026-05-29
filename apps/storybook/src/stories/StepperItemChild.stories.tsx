import type { Meta, StoryObj } from "@storybook/react";
import { StepperItem, StepperItemChild } from "@todam/ui";

const photo = (hex: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23${hex}'/%3E%3C/svg%3E`;

const sampleImages = [
  { src: photo("46C488"), alt: "체험 사진 1" },
  { src: photo("CCDFF6"), alt: "체험 사진 2" },
];

const meta: Meta<typeof StepperItemChild> = {
  title: "Components/StepperItemChild",
  component: StepperItemChild,
  parameters: { layout: "padded" },
  argTypes: {
    title: { control: "text" },
    date: { control: "text" },
  },
  args: {
    title: "체험이 완료되었어요",
    date: "26. 05. 08",
    images: sampleImages,
  },
};

export default meta;
type Story = StoryObj<typeof StepperItemChild>;

export const Playground: Story = {};

export const WithImages: Story = {
  name: "이미지 포함",
  render: () => (
    <StepperItemChild
      date="26. 05. 08"
      title="체험이 완료되었어요"
      images={sampleImages}
    />
  ),
};

export const TextOnly: Story = {
  name: "텍스트만",
  render: () => <StepperItemChild date="26. 05. 08" title="체험이 완료되었어요" />,
};

const steps = [
  { status: "completed" as const, date: "26. 05. 06", title: "체험 신청 완료" },
  { status: "completed" as const, date: "26. 05. 07", title: "방문 예약 완료" },
  { status: "current" as const, date: "26. 05. 08", title: "체험 진행 중", images: sampleImages },
  { status: "upcoming" as const, date: "", title: "체험 완료" },
];

export const WithStepperItem: Story = {
  name: "StepperItem 조합 (전체 스테퍼)",
  render: () => (
    <div className="flex flex-col bg-background p-6">
      {steps.map((step, i) => (
        <div key={step.title} className="flex gap-3">
          <StepperItem status={step.status} isLast={i === steps.length - 1} />
          <StepperItemChild
            date={step.date || undefined}
            title={step.title}
            images={step.images}
          />
        </div>
      ))}
    </div>
  ),
};
