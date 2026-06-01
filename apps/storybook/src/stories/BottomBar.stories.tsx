import type { Meta, StoryObj } from "@storybook/react";
import { BottomBar, Button } from "@todam/ui";

const meta: Meta<typeof BottomBar> = {
  title: "Components/Layout/BottomBar",
  component: BottomBar,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof BottomBar>;

export const SingleButton: Story = {
  name: "버튼 1개",
  render: () => (
    <div style={{ position: "fixed", bottom: 0, width: "100%" }}>
      <BottomBar>
        <Button variant="filled" className="w-full">다음</Button>
      </BottomBar>
    </div>
  ),
};

export const TwoButtons: Story = {
  name: "버튼 2개",
  render: () => (
    <div style={{ position: "fixed", bottom: 0, width: "100%" }}>
      <BottomBar>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1">홈으로</Button>
          <Button variant="filled" className="flex-1">내 예약 보기</Button>
        </div>
      </BottomBar>
    </div>
  ),
};

export const LabelAndButton: Story = {
  name: "라벨 + 버튼",
  render: () => (
    <div style={{ position: "fixed", bottom: 0, width: "100%" }}>
      <BottomBar>
        <div className="flex justify-between items-center w-full mb-3">
          <span className="text-sm text-foreground-secondary">체험일시</span>
          <span className="text-base font-semibold">4월 18일 오후 3시 · 2명</span>
        </div>
        <Button variant="filled" className="w-full">90,000원 예약하기</Button>
      </BottomBar>
    </div>
  ),
};
