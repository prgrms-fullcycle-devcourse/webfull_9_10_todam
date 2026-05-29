import type { Meta, StoryObj } from "@storybook/react";
import { FormBottomSheet } from "@todam/ui";

const meta: Meta<typeof FormBottomSheet> = {
  title: "Components/Feedback/FormBottomSheet",
  component: FormBottomSheet,
  parameters: { layout: "padded" },
  argTypes: {
    title: { control: "text" },
    subTitle: { control: "text" },
    actionLabel: { control: "text" },
    actionDisabled: { control: "boolean" },
    subLabel: { control: "text" },
  },
  args: {
    title: "타이틀",
    subTitle: "서브타이틀",
    actionLabel: "확인",
    actionDisabled: false,
  },
  decorators: [
    (Story) => (
      <div className="relative overflow-hidden bg-surface" style={{ width: 430, height: 500 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormBottomSheet>;

export const Default: Story = {
  name: "기본",
};

export const WithSubButton: Story = {
  name: "서브 버튼",
  args: { subLabel: "취소" },
};

export const Disabled: Story = {
  name: "액션 버튼 비활성",
  args: { actionDisabled: true, subLabel: "취소" },
};

export const WithChildren: Story = {
  name: "children 슬롯",
  render: () => (
    <div className="relative overflow-hidden bg-surface" style={{ width: 430, height: 500 }}>
      <FormBottomSheet
        title="비밀번호를 잊으셨나요?"
        subTitle="가입하신 이메일 주소를 입력해 주세요."
        actionLabel="재설정 링크 보내기"
        actionDisabled
        subLabel="취소"
      >
        <div className="rounded-xl border border-primary px-4 py-3 text-base text-foreground-tertiary">
          leadem@mail.com
        </div>
      </FormBottomSheet>
    </div>
  ),
};
