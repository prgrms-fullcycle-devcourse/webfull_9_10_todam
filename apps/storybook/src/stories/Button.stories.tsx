import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@todam/ui";
import { ScannerIcon } from "@todam/ui";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["filled", "outline", "ghost", "overlay"],
    },
    layout: {
      control: "select",
      options: ["onlyLabel", "iconLabel", "onlyIcon"],
    },
    size: { control: "radio", options: ["lg", "sm"] },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    children: "다음",
    variant: "filled",
    layout: "onlyLabel",
    size: "lg",
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const FilledLg: Story = {
  name: "filled / lg",
  render: () => (
    <div className="flex gap-4 items-center">
      <Button variant="filled" size="lg">다음</Button>
      <Button variant="filled" size="lg" icon={<ScannerIcon />} layout="iconLabel">다음</Button>
      <Button variant="filled" size="lg" icon={<ScannerIcon />} layout="onlyIcon" aria-label="스캔" />
    </div>
  ),
};

export const FilledSm: Story = {
  name: "filled / sm",
  render: () => (
    <div className="flex gap-4 items-center">
      <Button variant="filled" size="sm">다음</Button>
      <Button variant="filled" size="sm" icon={<ScannerIcon />} layout="iconLabel">다음</Button>
      <Button variant="filled" size="sm" icon={<ScannerIcon />} layout="onlyIcon" aria-label="스캔" />
    </div>
  ),
};

export const OutlineLg: Story = {
  name: "outline / lg",
  render: () => (
    <div className="flex gap-4 items-center">
      <Button variant="outline" size="lg">다음</Button>
      <Button variant="outline" size="lg" icon={<ScannerIcon />} layout="iconLabel">다음</Button>
      <Button variant="outline" size="lg" icon={<ScannerIcon />} layout="onlyIcon" aria-label="스캔" />
    </div>
  ),
};

export const OutlineSm: Story = {
  name: "outline / sm",
  render: () => (
    <div className="flex gap-4 items-center">
      <Button variant="outline" size="sm">다음</Button>
      <Button variant="outline" size="sm" icon={<ScannerIcon />} layout="iconLabel">다음</Button>
      <Button variant="outline" size="sm" icon={<ScannerIcon />} layout="onlyIcon" aria-label="스캔" />
    </div>
  ),
};

export const GhostLg: Story = {
  name: "ghost / lg",
  render: () => (
    <div className="flex gap-4 items-center">
      <Button variant="ghost" size="lg">다음</Button>
      <Button variant="ghost" size="lg" icon={<ScannerIcon />} layout="iconLabel">다음</Button>
      <Button variant="ghost" size="lg" icon={<ScannerIcon />} layout="onlyIcon" aria-label="스캔" />
    </div>
  ),
};

export const GhostSm: Story = {
  name: "ghost / sm",
  render: () => (
    <div className="flex gap-4 items-center">
      <Button variant="ghost" size="sm">다음</Button>
      <Button variant="ghost" size="sm" icon={<ScannerIcon />} layout="iconLabel">다음</Button>
      <Button variant="ghost" size="sm" icon={<ScannerIcon />} layout="onlyIcon" aria-label="스캔" />
    </div>
  ),
};

export const Overlay: Story = {
  name: "overlay (onlyIcon)",
  render: () => (
    <div className="flex gap-4 items-center p-8 bg-gray-400 rounded-2xl">
      <Button variant="overlay" size="lg" layout="onlyIcon" icon={<ScannerIcon />} aria-label="스캔" />
      <Button variant="overlay" size="sm" layout="onlyIcon" icon={<ScannerIcon />} aria-label="스캔" />
    </div>
  ),
};

export const DisabledAll: Story = {
  name: "disabled / all variants",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <Button variant="filled" size="lg" disabled>다음</Button>
        <Button variant="outline" size="lg" disabled>다음</Button>
        <Button variant="ghost" size="lg" disabled>다음</Button>
      </div>
      <div className="flex gap-4 items-center">
        <Button variant="filled" size="lg" layout="iconLabel" icon={<ScannerIcon />} disabled>다음</Button>
        <Button variant="outline" size="lg" layout="iconLabel" icon={<ScannerIcon />} disabled>다음</Button>
        <Button variant="ghost" size="lg" layout="iconLabel" icon={<ScannerIcon />} disabled>다음</Button>
      </div>
      <div className="flex gap-4 items-center">
        <Button variant="filled" size="lg" layout="onlyIcon" icon={<ScannerIcon />} disabled aria-label="스캔" />
        <Button variant="outline" size="lg" layout="onlyIcon" icon={<ScannerIcon />} disabled aria-label="스캔" />
        <Button variant="ghost" size="lg" layout="onlyIcon" icon={<ScannerIcon />} disabled aria-label="스캔" />
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  name: "전체 variant 비교",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-background min-w-[600px]">
      {(["filled", "outline", "ghost"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-3">
          <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">{variant}</p>
          <div className="flex gap-3 items-center flex-wrap">
            <Button variant={variant} size="lg">Label lg</Button>
            <Button variant={variant} size="sm">Label sm</Button>
            <Button variant={variant} size="lg" layout="iconLabel" icon={<ScannerIcon />}>Icon lg</Button>
            <Button variant={variant} size="sm" layout="iconLabel" icon={<ScannerIcon />}>Icon sm</Button>
            <Button variant={variant} size="lg" layout="onlyIcon" icon={<ScannerIcon />} aria-label="icon" />
            <Button variant={variant} size="sm" layout="onlyIcon" icon={<ScannerIcon />} aria-label="icon" />
            <Button variant={variant} size="lg" disabled>Disabled</Button>
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono text-foreground-tertiary uppercase tracking-wider">overlay</p>
        <div className="flex gap-3 items-center p-6 bg-gray-400 rounded-2xl w-fit">
          <Button variant="overlay" size="lg" layout="onlyIcon" icon={<ScannerIcon />} aria-label="icon" />
          <Button variant="overlay" size="sm" layout="onlyIcon" icon={<ScannerIcon />} aria-label="icon" />
        </div>
      </div>
    </div>
  ),
};
