import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AnimatePresence, motion } from "framer-motion";
import { Modal } from "@todam/ui";

const meta: Meta<typeof Modal> = {
  title: "Components/Feedback/Modal",
  component: Modal,
  parameters: { layout: "padded" },
  argTypes: {
    type: { control: "radio", options: ["shortText", "longText"] },
    title: { control: "text" },
    description: { control: "text" },
    confirmLabel: { control: "text" },
    cancelLabel: { control: "text" },
    danger: { control: "boolean" },
  },
  args: {
    type: "shortText",
    title: "타이틀",
    description: "설명 텍스트가 들어갑니다.",
    confirmLabel: "확인",
    cancelLabel: "취소",
    danger: false,
  },
  decorators: [
    (Story) => (
      <div className="relative overflow-hidden bg-surface" style={{ width: 430, height: 400 }}>
        {/* 백드롭은 마운트 측(AppModal) 책임 → 스토리에서 동일 dim 컨테이너로 재현 */}
        <div className="absolute inset-0 flex items-center justify-center bg-inverse/80 px-5">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const ShortText: Story = {
  name: "shortText (가로 버튼)",
  args: { type: "shortText" },
};

export const LongText: Story = {
  name: "longText (세로 버튼)",
  args: { type: "longText", confirmLabel: "다음", cancelLabel: "취소" },
};

export const Danger: Story = {
  name: "danger (확인 버튼 red)",
  args: { type: "shortText", title: "정말 삭제하시겠어요?", confirmLabel: "삭제", danger: true },
};

function ModalAnimationDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-center bg-surface" style={{ width: 430, height: 500 }}>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white"
      >
        모달 열기
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-inverse/80 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <Modal
              type="shortText"
              title="정말 삭제하시겠어요?"
              description="삭제하면 되돌릴 수 없습니다."
              confirmLabel="삭제"
              cancelLabel="취소"
              danger
              onConfirm={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const AnimationDemo: Story = {
  name: "애니메이션 데모",
  parameters: { layout: "centered" },
  render: () => <ModalAnimationDemo />,
};
