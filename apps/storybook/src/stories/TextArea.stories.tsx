import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TextArea } from "@todam/ui";

const meta: Meta<typeof TextArea> = {
  title: "Components/TextArea",
  component: TextArea,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    required: { control: "boolean" },
    error: { control: "boolean" },
    disabled: { control: "boolean" },
    showCount: { control: "boolean" },
  },
  args: {
    label: "라벨",
    placeholder: "text",
    required: false,
    error: false,
    disabled: false,
    showCount: true,
    maxLength: 1000,
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    return (
      <TextArea
        {...args}
        id="playground"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const Default: Story = {
  name: "status / default",
  render: () => (
    <TextArea label="라벨" placeholder="text" showCount maxLength={1000} />
  ),
};

export const Filled: Story = {
  name: "status / filled",
  render: () => (
    <TextArea label="라벨" defaultValue="text" showCount maxLength={1000} />
  ),
};

export const Focus: Story = {
  name: "status / focus (autoFocus)",
  render: () => (
    <TextArea label="라벨" placeholder="text" showCount maxLength={1000} autoFocus />
  ),
};

export const Disabled: Story = {
  name: "status / disabled",
  render: () => (
    <TextArea label="라벨" defaultValue="text" showCount maxLength={1000} disabled />
  ),
};

export const WithActionButton: Story = {
  name: "라벨 옆 버튼",
  render: () => (
    <TextArea
      label="리뷰"
      actionLabel="버튼"
      onActionClick={() => alert("버튼 클릭")}
      placeholder="text"
      showCount
      maxLength={1000}
    />
  ),
};

export const WithError: Story = {
  name: "error + helper text (글자 수 초과)",
  render: () => (
    <TextArea
      label="리뷰"
      required
      defaultValue="최대 글자 수를 넘긴 예시 텍스트입니다"
      error
      helperText="최대 글자 수를 초과했습니다"
      showCount
      maxLength={10}
    />
  ),
};

export const AllStates: Story = {
  name: "전체 상태 비교",
  parameters: { layout: "padded" },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-6 p-8 bg-background w-[440px]">
      <TextArea label="default" placeholder="text" showCount maxLength={1000} />
      <TextArea label="filled" defaultValue="text" showCount maxLength={1000} />
      <TextArea
        label="disabled"
        defaultValue="text"
        showCount
        maxLength={1000}
        disabled
      />
      <TextArea
        label="error"
        required
        defaultValue="text"
        error
        helperText="에러 메시지"
        showCount
        maxLength={1000}
      />
    </div>
  ),
};
