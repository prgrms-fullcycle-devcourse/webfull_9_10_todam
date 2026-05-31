import type { Meta, StoryObj } from "@storybook/react";
import { StandardBottomSheet } from "@todam/ui";

const meta: Meta<typeof StandardBottomSheet> = {
  title: "Components/Feedback/StandardBottomSheet",
  component: StandardBottomSheet,
  parameters: { layout: "padded" },
  argTypes: {
    title: { control: "text" },
    subTitle: { control: "text" },
    actionLabel: { control: "text" },
    subLabel: { control: "text" },
  },
  args: {
    title: "타이틀",
    subTitle: "서브타이틀",
    actionLabel: "확인",
  },
  decorators: [
    (Story) => (
      <div className="relative overflow-hidden bg-surface" style={{ width: 430, height: 600 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StandardBottomSheet>;

export const Default: Story = {
  name: "기본",
};

export const WithSubButton: Story = {
  name: "서브 버튼",
  args: { subLabel: "취소" },
};

export const WithChildren: Story = {
  name: "children 슬롯",
  render: () => (
    <div className="relative overflow-hidden bg-surface" style={{ width: 430, height: 600 }}>
      <StandardBottomSheet title="공방 선택" subTitle="원하는 공방을 선택하세요" actionLabel="선택 완료">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-muted p-4 text-base text-foreground">공방 A</div>
          <div className="rounded-xl bg-muted p-4 text-base text-foreground">공방 B</div>
          <div className="rounded-xl bg-muted p-4 text-base text-foreground">공방 C</div>
        </div>
      </StandardBottomSheet>
    </div>
  ),
};
