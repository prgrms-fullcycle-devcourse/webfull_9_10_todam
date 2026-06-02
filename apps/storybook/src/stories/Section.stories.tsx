import type { Meta, StoryObj } from "@storybook/react";
import { Section } from "@todam/ui";

const meta: Meta<typeof Section> = {
  title: "Components/Layout/Section",
  component: Section,
  parameters: { layout: "centered" },
  argTypes: {
    gap: { control: "text" },
    align: { control: "text" },
  },
  args: {
    gap: "gap-3",
    align: "items-center",
    children: "콘텐츠",
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Playground: Story = {};

export const Default: Story = {
  name: "기본 (gap-3 / items-center)",
  render: () => (
    <Section>
      <div style={{ background: "white", borderRadius: 6, padding: "12px", width: "100%", textAlign: "center" }}>첫 번째</div>
      <div style={{ background: "white", borderRadius: 6, padding: "12px", width: "100%", textAlign: "center" }}>두 번째</div>
      <div style={{ background: "white", borderRadius: 6, padding: "12px", width: "100%", textAlign: "center" }}>세 번째</div>
    </Section>
  ),
};

export const CustomGap: Story = {
  name: "gap 커스텀 (gap-5)",
  render: () => (
    <Section gap="gap-5">
      <div style={{ background: "white", borderRadius: 6, padding: "12px", width: "100%", textAlign: "center" }}>첫 번째</div>
      <div style={{ background: "white", borderRadius: 6, padding: "12px", width: "100%", textAlign: "center" }}>두 번째</div>
      <div style={{ background: "white", borderRadius: 6, padding: "12px", width: "100%", textAlign: "center" }}>세 번째</div>
    </Section>
  ),
};

export const AlignStart: Story = {
  name: "align 커스텀 (items-start)",
  render: () => (
    <Section align="items-start">
      <div style={{ background: "white", borderRadius: 6, padding: "12px", textAlign: "center" }}>짧은 콘텐츠</div>
      <div style={{ background: "white", borderRadius: 6, padding: "12px", width: 192, textAlign: "center" }}>중간 콘텐츠</div>
      <div style={{ background: "white", borderRadius: 6, padding: "12px", width: "100%", textAlign: "center" }}>긴 콘텐츠</div>
    </Section>
  ),
};
