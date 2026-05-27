import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";

const semanticGroups = [
  {
    group: "Surface",
    tokens: ["background", "surface", "muted", "emphasis", "inverse"],
  },
  {
    group: "Border",
    tokens: ["border-subtle", "border", "border-strong"],
  },
  {
    group: "Foreground",
    tokens: [
      "foreground",
      "foreground-secondary",
      "foreground-tertiary",
      "foreground-disabled",
      "foreground-inverse",
    ],
  },
  {
    group: "Primary",
    tokens: ["primary-subtle", "primary-lighter", "primary", "primary-darker"],
  },
  {
    group: "Secondary",
    tokens: [
      "secondary-subtle",
      "secondary-lighter",
      "secondary",
      "secondary-darker",
    ],
  },
  {
    group: "Warning",
    tokens: ["warning-subtle", "warning-lighter", "warning", "warning-darker"],
  },
  {
    group: "Danger",
    tokens: ["danger-subtle", "danger-lighter", "danger", "danger-darker"],
  },
  {
    group: "Info",
    tokens: ["info-subtle", "info-lighter", "info", "info-darker"],
  },
  {
    group: "Success",
    tokens: ["success-subtle", "success-lighter", "success", "success-darker"],
  },
];

const primitiveGroups = [
  {
    group: "Gray",
    prefix: "gray",
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    group: "Deep Green",
    prefix: "deep-green",
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    group: "Gold",
    prefix: "gold",
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    group: "Blue",
    prefix: "blue",
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    group: "Green",
    prefix: "green",
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    group: "Red",
    prefix: "red",
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    group: "Yellow",
    prefix: "yellow",
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
];

function useComputedColor(cssVar: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    const value = getComputedStyle(ref.current)
      .getPropertyValue(cssVar)
      .trim();
    setHex(value);
  }, [cssVar]);

  return { ref, hex };
}

function ColorSwatch({ token }: { token: string }) {
  const cssVar = `--color-${token}`;
  const { ref, hex } = useComputedColor(cssVar);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(cssVar);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="flex flex-col gap-1.5 text-left cursor-pointer"
      title={`Copy ${cssVar}`}
    >
      <div
        ref={ref}
        className="w-14 h-14 rounded-xl border border-border-subtle shadow-sm transition-transform hover:scale-105"
        style={{ background: `var(${cssVar})` }}
      />
      <div className="flex flex-col gap-0.5 max-w-[56px]">
        <span className="text-[10px] font-mono text-foreground leading-tight break-all">
          {copied ? "✓ copied" : token}
        </span>
        <span className="text-[10px] font-mono text-foreground-tertiary leading-tight">
          {hex}
        </span>
      </div>
    </button>
  );
}

function ColorsPage() {
  return (
    <div className="p-10 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-foreground mb-1">Color Tokens</h1>
      <p className="text-sm text-foreground-secondary mb-10">
        스와치 클릭 시 CSS 변수명 복사 · Tailwind 사용법:{" "}
        <code className="font-mono bg-muted px-1 rounded">
          bg-[--color-primary]
        </code>{" "}
        또는{" "}
        <code className="font-mono bg-muted px-1 rounded">text-foreground</code>
      </p>

      <section className="mb-14">
        <h2 className="text-base font-semibold text-foreground mb-6 pb-2 border-b border-border">
          Semantic Tokens
        </h2>
        <div className="flex flex-col gap-10">
          {semanticGroups.map(({ group, tokens }) => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
                {group}
              </h3>
              <div className="flex flex-wrap gap-5">
                {tokens.map((token) => (
                  <ColorSwatch key={token} token={token} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground mb-6 pb-2 border-b border-border">
          Primitive Tokens
        </h2>
        <div className="flex flex-col gap-10">
          {primitiveGroups.map(({ group, prefix, shades }) => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
                {group}
              </h3>
              <div className="flex flex-wrap gap-5">
                {shades.map((shade) => (
                  <ColorSwatch key={shade} token={`${prefix}-${shade}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta = {
  title: "Design System/Colors",
  component: ColorsPage,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const AllTokens: Story = {};
