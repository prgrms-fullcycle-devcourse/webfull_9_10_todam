import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TextInput, SearchIcon } from "@todam/ui";

const meta: Meta<typeof TextInput> = {
  title: "Components/TextInput",
  component: TextInput,
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
    helperText: { control: "text" },
    required: { control: "boolean" },
    error: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "라벨",
    placeholder: "text",
    required: false,
    error: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof TextInput>;

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    return (
      <TextInput
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
  render: () => <TextInput label="라벨" placeholder="text" />,
};

export const Filled: Story = {
  name: "status / filled",
  render: () => <TextInput label="라벨" defaultValue="text" />,
};

export const Focus: Story = {
  name: "status / focus (autoFocus)",
  render: () => <TextInput label="라벨" placeholder="text" autoFocus />,
};

export const Disabled: Story = {
  name: "status / disabled",
  render: () => <TextInput label="라벨" defaultValue="text" disabled />,
};

export const Required: Story = {
  name: "required",
  render: () => <TextInput label="이메일" required placeholder="text" />,
};

export const WithError: Story = {
  name: "error + helper text",
  render: () => (
    <TextInput
      label="이메일"
      required
      defaultValue="invalid-email"
      error
      helperText="올바른 이메일 형식이 아닙니다"
    />
  ),
};

export const WithIcon: Story = {
  name: "icon",
  render: () => (
    <TextInput label="검색" placeholder="text" icon={<SearchIcon size={16} />} />
  ),
};

export const AllStates: Story = {
  name: "전체 상태 비교",
  parameters: { layout: "padded" },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-6 p-8 bg-background w-[440px]">
      <TextInput label="default" placeholder="text" />
      <TextInput label="filled" defaultValue="text" />
      <TextInput label="disabled" defaultValue="text" disabled />
      <TextInput
        label="error"
        required
        defaultValue="text"
        error
        helperText="에러 메시지"
      />
    </div>
  ),
};
