import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Menu } from "@todam/ui";

const meta: Meta<typeof Menu> = {
  title: "Components/Data Display/Menu",
  component: Menu,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[260px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Playground: Story = {
  render: () => {
    const [items, setItems] = useState([
      { label: "메뉴 아이템", selected: true },
      { label: "메뉴 아이템", selected: true },
      { label: "메뉴 아이템", selected: true },
    ]);
    const toggle = (index: number) =>
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, selected: !item.selected } : item,
        ),
      );
    return <Menu title="타이틀" items={items} onItemSelect={toggle} />;
  },
};

export const AllSelected: Story = {
  name: "전체 선택 (Figma 기준)",
  render: () => (
    <Menu
      title="타이틀"
      items={[
        { label: "메뉴 아이템", selected: true },
        { label: "메뉴 아이템", selected: true },
        { label: "메뉴 아이템", selected: true },
      ]}
    />
  ),
};

export const SingleSelected: Story = {
  name: "단일 선택",
  render: () => (
    <Menu
      title="정렬"
      items={[
        { label: "최신순", selected: true },
        { label: "인기순" },
        { label: "가격순" },
      ]}
    />
  ),
};

export const NoTitle: Story = {
  name: "타이틀 없음",
  render: () => (
    <Menu
      items={[
        { label: "수정" },
        { label: "공유" },
        { label: "삭제" },
      ]}
    />
  ),
};
