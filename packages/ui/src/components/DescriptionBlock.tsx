import { cloneElement } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { SparkleIcon } from "../icons";

export type DescriptionBlockType =
  | "default"
  | "positive"
  | "negative"
  | "info"
  | "warn";

export type DescriptionBlockProps = {
  type?: DescriptionBlockType;
  title?: ReactNode;
  icon?: ReactElement<{ size?: number }>;
  children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const typeClasses: Record<
  DescriptionBlockType,
  { box: string; title: string; desc: string }
> = {
  default: {
    box: "border border-dashed border-border",
    title: "text-foreground",
    desc: "text-foreground-tertiary",
  },
  positive: {
    box: "bg-success-subtle",
    title: "text-success-darker",
    desc: "text-success-darker",
  },
  negative: {
    box: "bg-danger-subtle",
    title: "text-danger-darker",
    desc: "text-danger-darker",
  },
  info: {
    box: "bg-info-subtle",
    title: "text-info-darker",
    desc: "text-info-darker",
  },
  warn: {
    box: "bg-warning-subtle",
    title: "text-warning-darker",
    desc: "text-warning-darker",
  },
};

export function DescriptionBlock({
  type = "default",
  title,
  icon = <SparkleIcon />,
  children,
  className,
  ...props
}: DescriptionBlockProps) {
  const styles = typeClasses[type];
  const clonedIcon = icon ? cloneElement(icon, { size: 12 }) : null;

  return (
    <div
      className={["flex w-full flex-col gap-3 rounded-2xl p-4", styles.box, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {(title || clonedIcon) && (
        <div className={["flex items-center gap-2", styles.title].join(" ")}>
          {clonedIcon}
          {title && <span className="text-xs font-semibold">{title}</span>}
        </div>
      )}
      {children && <p className={["text-xs", styles.desc].join(" ")}>{children}</p>}
    </div>
  );
}
