import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AnimatePresence, motion } from "framer-motion";
import { Toast } from "@todam/ui";
import { NotiIcon } from "@todam/ui";

const meta: Meta<typeof Toast> = {
  title: "Components/Toast",
  component: Toast,
  parameters: { layout: "centered" },
  argTypes: {
    type: { control: "radio", options: ["icon", "button"] },
    message: { control: "text" },
    actionLabel: { control: "text" },
  },
  args: {
    type: "icon",
    message: "토스트 메세지",
    actionLabel: "취소",
    icon: <NotiIcon />,
  },
  decorators: [
    (Story) => (
      <div className="w-[327px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Playground: Story = {};

export const TypeIcon: Story = {
  name: "type=icon",
  args: { type: "icon" },
};

export const TypeButton: Story = {
  name: "type=button",
  args: { type: "button" },
};

export const WithoutIcon: Story = {
  name: "아이콘 없음",
  args: { type: "icon", icon: undefined },
};

function ToastAnimationDemo() {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex w-[327px] flex-col gap-4">
      <button
        onClick={() => setVisible((v) => !v)}
        className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white"
      >
        {visible ? "토스트 숨기기" : "토스트 보기"}
      </button>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <Toast type="icon" message="토스트 메세지" icon={<NotiIcon />} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const AnimationDemo: Story = {
  name: "애니메이션 데모",
  parameters: { layout: "padded" },
  render: () => <ToastAnimationDemo />,
};

export const AllVariants: Story = {
  name: "전체 variant 비교",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex w-[327px] flex-col gap-4">
      <Toast type="icon" message="토스트 메세지" icon={<NotiIcon />} />
      <Toast type="button" message="토스트 메세지" icon={<NotiIcon />} actionLabel="취소" />
      <Toast type="icon" message="아이콘 없는 토스트" />
    </div>
  ),
};
