import type { Meta, StoryObj } from "@storybook/react";
import { DescriptionBlock } from "@todam/ui";

const meta: Meta<typeof DescriptionBlock> = {
  title: "Components/DescriptionBlock",
  component: DescriptionBlock,
  parameters: { layout: "padded" },
  argTypes: {
    type: {
      control: "select",
      options: ["default", "positive", "negative", "info", "warn"],
    },
    title: { control: "text" },
    children: { control: "text" },
  },
  args: {
    type: "default",
    title: "안내",
    children: "여기에 설명 텍스트가 들어갑니다.",
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DescriptionBlock>;

export const Playground: Story = {};

export const AllTypes: Story = {
  name: "type 전체",
  render: () => (
    <div className="flex w-[360px] flex-col gap-3">
      <DescriptionBlock type="default" title="default">
        기본 안내 메시지입니다.
      </DescriptionBlock>
      <DescriptionBlock type="positive" title="positive">
        정상적으로 처리되었습니다.
      </DescriptionBlock>
      <DescriptionBlock type="negative" title="negative">
        오류가 발생했습니다.
      </DescriptionBlock>
      <DescriptionBlock type="info" title="info">
        참고할 정보를 안내합니다.
      </DescriptionBlock>
      <DescriptionBlock type="warn" title="warn">
        주의가 필요한 항목입니다.
      </DescriptionBlock>
    </div>
  ),
};
