import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { ReactElement } from "react";
import * as Icons from "@todam/ui";
import type { IconProps } from "@todam/ui";

type IconComponent = (props: IconProps) => ReactElement;

const iconEntries = (
  Object.entries(Icons) as [string, unknown][]
).filter(
  ([key, val]) => key.endsWith("Icon") && typeof val === "function"
) as [string, IconComponent][];

function IconCard({
  name,
  Component,
}: {
  name: string;
  Component: IconComponent;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(`<${name} />`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary-subtle transition-colors cursor-pointer min-w-[88px]"
      title={`Copy <${name} />`}
    >
      <Component size={24} />
      <span className="text-[10px] font-mono text-foreground-secondary text-center leading-tight break-all">
        {copied ? "✓ copied" : name.replace("Icon", "")}
      </span>
    </button>
  );
}

function IconsPage() {
  const [query, setQuery] = useState("");

  const filtered = iconEntries.filter(([name]) =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-10 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-foreground mb-1">Icons</h1>
      <p className="text-sm text-foreground-secondary mb-6">
        {iconEntries.length}개 아이콘 · 클릭 시 컴포넌트 코드 복사
      </p>

      <input
        type="text"
        placeholder="아이콘 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-xs px-4 py-2 rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-primary mb-8 text-sm"
      />

      {filtered.length === 0 ? (
        <p className="text-foreground-tertiary text-sm">
          &quot;{query}&quot; 에 해당하는 아이콘이 없습니다.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filtered.map(([name, Component]) => (
            <IconCard key={name} name={name} Component={Component} />
          ))}
        </div>
      )}
    </div>
  );
}

const meta: Meta = {
  title: "Design System/Icons",
  component: IconsPage,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const AllIcons: Story = {};
