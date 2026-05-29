import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "../../../web/src/components/Header";
import { useState } from "react";

const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[390px] overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-lg">
    {children}
  </div>
);

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <Story />
      </PhoneFrame>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Home: Story = {
  name: "home — 로고 + 알림",
  render: () => <Header type="home" />,
};

export const Main: Story = {
  name: "main — 타이틀 + 알림",
  render: () => <Header type="main" title="저장한 공방" />,
};

export const MainText: Story = {
  name: "mainText — 타이틀 + 텍스트 액션",
  render: () => <Header type="mainText" title="저장한 공방" actionLabel="선택" />,
};

export const Sub: Story = {
  name: "sub — 뒤로가기 + 타이틀 + 알림",
  render: () => <Header type="sub" title="공방 상세" />,
};

export const SubText: Story = {
  name: "subText — 뒤로가기 + 타이틀 + 텍스트 액션",
  render: () => <Header type="subText" title="저장 목록" actionLabel="선택" />,
};

export const Popup: Story = {
  name: "popup — 닫기(×)",
  render: () => <Header type="popup" />,
};

export const Search: Story = {
  name: "search — 검색 input + 닫기",
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Header
        type="search"
        searchValue={value}
        onSearchChange={setValue}
        onSearchClear={() => setValue("")}
      />
    );
  },
};

export const LongTitle: Story = {
  name: "긴 타이틀 말줄임",
  render: () => (
    <div className="flex flex-col gap-0">
      <Header type="main" title="제목이 매우 길어지면 말줄임표로 처리됩니다" />
      <Header type="sub" title="뒤로가기가 있는 서브 페이지 제목이 길어지는 경우" />
    </div>
  ),
};

export const AllVariants: Story = {
  name: "전체 variant 비교",
  parameters: { layout: "padded" },
  decorators: [],
  render: () => {
    const [searchValue, setSearchValue] = useState("");
    return (
      <div className="flex flex-col gap-4 p-8 bg-background min-w-[500px]">
        {(
          [
            { label: "home", node: <Header type="home" /> },
            { label: "main", node: <Header type="main" title="저장한 공방" /> },
            { label: "mainText", node: <Header type="mainText" title="저장한 공방" /> },
            { label: "sub", node: <Header type="sub" title="공방 상세" /> },
            { label: "subText", node: <Header type="subText" title="저장 목록" /> },
            { label: "popup", node: <Header type="popup" /> },
            {
              label: "search",
              node: (
                <Header
                  type="search"
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  onSearchClear={() => setSearchValue("")}
                />
              ),
            },
          ] as const
        ).map(({ label, node }) => (
          <div key={label} className="flex flex-col gap-1">
            <p className="text-xs font-mono text-foreground-tertiary">{label}</p>
            <div className="w-[390px] overflow-hidden rounded-xl border border-border-subtle">
              {node}
            </div>
          </div>
        ))}
      </div>
    );
  },
};
