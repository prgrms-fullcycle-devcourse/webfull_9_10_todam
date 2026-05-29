import type { Meta, StoryObj } from "@storybook/react";
import { SectionTitle, PinIcon } from "@todam/ui";

const meta: Meta<typeof SectionTitle> = {
  title: "Components/Layout/SectionTitle",
  component: SectionTitle,
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "radio", options: ["lg", "md", "sm"] },
    title: { control: "text" },
    subText: { control: "text" },
  },
  args: {
    title: "섹션 제목",
    size: "lg",
  },
};

export default meta;
type Story = StoryObj<typeof SectionTitle>;

export const Playground: Story = {};

export const AllSizes: Story = {
  name: "전체 size 비교",
  render: () => (
    <div style={{ width: 328, display: "flex", flexDirection: "column" }}>
      <SectionTitle size="lg" title="Large 제목" subText="서브텍스트" icon={<PinIcon size={16} />} />
      <SectionTitle size="md" title="Medium 제목" subText="서브텍스트" icon={<PinIcon size={16} />} />
      <SectionTitle size="sm" title="Small 제목" subText="서브텍스트" icon={<PinIcon size={16} />} />
    </div>
  ),
};

export const WithoutSubText: Story = {
  name: "subText 없음",
  render: () => (
    <div style={{ width: 328, display: "flex", flexDirection: "column" }}>
      <SectionTitle size="lg" title="Large 제목" />
      <SectionTitle size="md" title="Medium 제목" />
      <SectionTitle size="sm" title="Small 제목" />
    </div>
  ),
};
