import type { ReactElement } from "react";

export type InfoTableRow = {
  label: string;
  value: string;
  icon?: ReactElement;
};

export type InfoTableProps = {
  rows?: InfoTableRow[];
  /** Tailwind bg class. Default "bg-surface". */
  background?: string;
  className?: string;
};

const defaultRows: InfoTableRow[] = [{ label: "td", value: "td" }];

export function InfoTable({
  rows = defaultRows,
  background = "bg-surface",
  className,
}: InfoTableProps) {
  return (
    <div
      className={[
        "flex flex-col rounded-2xl px-4 py-1 w-full",
        background,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex items-start gap-2 py-4 border-b border-border-subtle last:border-b-0"
        >
          <div className="flex items-center gap-1 text-sm text-foreground-tertiary">
            {row.icon}
            <span>{row.label}</span>
          </div>
          <span className="flex-1 text-right text-sm font-semibold text-foreground">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
