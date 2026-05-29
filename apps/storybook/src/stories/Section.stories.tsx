import type { Meta, StoryObj } from "@storybook/react";
import { Section } from "@todam/ui";

const meta: Meta<typeof Section> = {
  title: "Components/Section",
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
      <div className="rounded p-3 w-full text-center">첫 번째</div>
      <div className="rounded p-3 w-full text-center">두 번째</div>
      <div className="rounded p-3 w-full text-center">세 번째</div>
    </Section>
  ),
};

export const CustomGap: Story = {
  name: "gap 커스텀 (gap-5)",
  render: () => (
    <Section gap="gap-5">
      <div className="rounded p-3 w-full text-center">첫 번째</div>
      <div className="rounded p-3 w-full text-center">두 번째</div>
      <div className="rounded p-3 w-full text-center">세 번째</div>
    </Section>
  ),
};

export const AlignStart: Story = {
  name: "align 커스텀 (items-start)",
  render: () => (
    <Section align="items-start">
      <div className="rounded p-3 text-center">짧은 콘텐츠</div>
      <div className="rounded p-3 w-48 text-center">중간 콘텐츠</div>
      <div className="rounded p-3 w-full text-center">긴 콘텐츠</div>
    </Section>
  ),
};
